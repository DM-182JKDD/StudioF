import { createServer } from 'node:http';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const port = Number(process.env['PORT'] ?? 3001);
const clientId = process.env['SOAP_CLIENT_ID'] ?? '0000000358';
const endpoint = new URL(
  process.env['SOAP_ENDPOINT']
    ?? 'https://webservices-pru.tecnologiatransaccional.com/DEBITO/WebServices_PrepagoLealtad/Sitios.asmx'
);
const maxBodyBytes = 8 * 1024;
const maxSoapResponseBytes = 1024 * 1024;
const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
  cdataPropName: '#cdata'
});

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT debe ser un puerto válido entre 1 y 65535.');
}
if (!/^\d{1,20}$/.test(clientId)) {
  throw new Error('SOAP_CLIENT_ID debe contener únicamente dígitos.');
}
if (endpoint.protocol !== 'https:') {
  throw new Error('SOAP_ENDPOINT debe utilizar HTTPS.');
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function findNode(value, name) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNode(item, name);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  for (const [key, child] of Object.entries(value)) {
    if (key.toLowerCase() === name.toLowerCase()) return child;
  }
  for (const child of Object.values(value)) {
    const found = findNode(child, name);
    if (found !== undefined) return found;
  }
  return undefined;
}

function textValue(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text || null;
  }
  if (Array.isArray(value)) return textValue(value[0]);
  if (typeof value === 'object' && value !== null) {
    return textValue(value['#text'] ?? value['#cdata']);
  }
  return null;
}

function parseXml(xml) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('XML no permitido.');
  const validation = XMLValidator.validate(xml);
  if (validation !== true) throw new Error('Respuesta XML inválida.');
  return parser.parse(xml);
}

function parseSoapResult(xml, operation) {
  const document = parseXml(xml);
  const fault = findNode(document, 'Fault');
  if (fault !== undefined) {
    const message = textValue(findNode(fault, 'faultstring'));
    throw new Error(message ?? 'El servicio SOAP devolvió un error.');
  }
  const result = findNode(document, `${operation}Result`);
  if (result === undefined) throw new Error(`Falta ${operation}Result en la respuesta SOAP.`);
  const embeddedXml = textValue(result);
  return embeddedXml ? parseXml(embeddedXml) : result;
}

function field(document, name) {
  return textValue(findNode(document, name));
}

function soapEnvelope(operation, parameters) {
  const elements = Object.entries(parameters)
    .map(([name, value]) => `<${name}>${xmlEscape(value)}</${name}>`)
    .join('');
  return `<?xml version="1.0" encoding="utf-8"?>`
    + `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">`
    + `<soap:Body><${operation} xmlns="http://tempuri.org/">`
    + `${elements}</${operation}></soap:Body></soap:Envelope>`;
}

async function callSoap(operation, parameters) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': `"http://tempuri.org/${operation}"`
    },
    body: soapEnvelope(operation, parameters),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`El servicio SOAP respondió HTTP ${response.status}.`);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('El servicio SOAP devolvió una respuesta vacía.');
  const chunks = [];
  let responseSize = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    responseSize += value.byteLength;
    if (responseSize > maxSoapResponseBytes) {
      await reader.cancel();
      throw new Error('La respuesta SOAP excede el tamaño permitido.');
    }
    chunks.push(value);
  }
  const responseBytes = new Uint8Array(responseSize);
  let offset = 0;
  for (const chunk of chunks) {
    responseBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const responseXml = new TextDecoder().decode(responseBytes);
  return parseSoapResult(responseXml, operation);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new HttpError(413, 'La solicitud excede el tamaño permitido.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'La solicitud debe contener JSON válido.');
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(body));
}

async function login(request, response) {
  if (!request.headers['content-type']?.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'El contenido debe enviarse como JSON.');
  }
  const body = await readJson(request);
  if (
    typeof body !== 'object'
    || body === null
    || typeof body.username !== 'string'
    || typeof body.password !== 'string'
    || body.username.trim().length === 0
    || body.username.length > 48
    || body.password.length === 0
    || body.password.length > 17
  ) {
    throw new HttpError(400, 'Ingresa un usuario y contraseña válidos.');
  }

  let loginResult;
  try {
    loginResult = await callSoap('w_getLoginWeb', {
      LOGIN: body.username,
      ENCRIP: body.password,
      ID_CLIENTE: clientId
    });
  } catch (error) {
    console.error('Error de comunicación SOAP durante el login:', error);
    throw new HttpError(502, 'No fue posible comunicarse con el servicio de autenticación.');
  }

  const firstName = field(loginResult, 'USC_NOMBRE');
  if (!firstName) {
    throw new HttpError(401, field(loginResult, 'MENSAJE') ?? 'Usuario o contraseña incorrectos.');
  }

  const displayName = [firstName, field(loginResult, 'USC_APELLIDO')]
    .filter(Boolean)
    .join(' ');
  const accountLogin = field(loginResult, 'USC_LOGIN') ?? body.username;
  const cardNumber = field(loginResult, 'TAR_NUMERO');
  const pointResults = cardNumber
    ? await Promise.allSettled([
      callSoap('w_validaciones', {
        TARJETA: cardNumber,
        LOGIN: accountLogin
      }),
      callSoap('w_validacionesempresa', {
        EMPRESA: clientId,
        LOGIN: accountLogin
      })
    ])
    : [];
  const pointsResult = pointResults[0] ?? { status: 'rejected', reason: new Error('Falta TAR_NUMERO.') };
  const unitResult = pointResults[1] ?? { status: 'rejected', reason: new Error('Falta TAR_NUMERO.') };
  const points = pointsResult.status === 'fulfilled'
    ? field(pointsResult.value, 'TCM_FINAL')
    : null;
  const pointsUnit = unitResult.status === 'fulfilled'
    ? field(unitResult.value, 'UNI_NOMBRE')
    : null;
  const pointsUnavailable = points === null;
  const pointsUnitUnavailable = pointsUnit === null;

  if (pointsUnavailable || pointsUnitUnavailable) {
    if (pointsUnavailable) {
      const error = pointsResult.status === 'rejected' ? pointsResult.reason : 'Falta TCM_FINAL.';
      console.error('Error al consultar w_validaciones:', error);
    }
    if (pointsUnitUnavailable) {
      const error = unitResult.status === 'rejected' ? unitResult.reason : 'Falta UNI_NOMBRE.';
      console.error('Error al consultar w_validacionesempresa:', error);
    }
  }

  sendJson(response, 200, {
    name: displayName,
    points,
    pointsUnit,
    availableSections: ['inicio', ...(points !== null ? ['puntos'] : [])],
    pointsNotice: pointsUnavailable ? 'No fue posible consultar el saldo de puntos.' : null
  });
}

const server = createServer(async (request, response) => {
  if (request.method !== 'POST' || request.url !== '/api/login') {
    sendJson(response, 404, { message: 'Ruta no encontrada.' });
    return;
  }
  try {
    await login(request, response);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error('Error inesperado en el backend de login:', error);
    sendJson(response, status, {
      message: error instanceof HttpError ? error.message : 'Ocurrió un error al procesar el login.'
    });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Intermediario SOAP Studio F escuchando en http://127.0.0.1:${port}`);
});
