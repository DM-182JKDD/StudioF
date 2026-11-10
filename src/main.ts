import { bootstrapApplication } from '@angular/platform-browser';
import { Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Section = 'inicio' | 'acerca' | 'beneficios' | 'politicas' | 'establecimientos' | 'cuenta' | 'contacto';
type AccountSection = 'inicio' | 'puntos' | 'movimientos' | 'password' | 'profile' | 'stores' | 'rewards';

@Component({ selector: 'app-root', standalone: true, imports: [FormsModule], template: `
<header class="top"><span>.:: STUDIO F ::. | 0.0.5</span><button class="login-link" (click)="navigate('cuenta')">Iniciar sesión</button></header>
<div class="brand"><img src="./img/logo/logo_studiof.jpg" alt="STUDIO F"></div>
<nav aria-label="Navegación principal"><div class="nav-links">
@for (item of navigation; track item.id) { <button [class.active]="section() === item.id" [attr.aria-current]="section() === item.id ? 'page' : null" [attr.aria-label]="item.label" [title]="item.label" (click)="navigate(item.id)">
@switch (item.id) {
  @case ('inicio') { <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg> }
  @case ('acerca') { <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg> }
  @case ('beneficios') { <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 12v9H4v-9m-2-5h20v5H2zm10 0v14m0-14H8a3 3 0 1 1 3-3c0 3 1 3 1 3Zm0 0h4a3 3 0 1 0-3-3c0 3-1 3-1 3Z"/></svg> }
  @case ('politicas') { <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7m-7 4h7"/></svg> }
  @case ('establecimientos') { <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg> }
  @case ('cuenta') { <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> }
  @case ('contacto') { <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-5-3 14 14 0 0 1-3-5l3-2z"/></svg> }
}
<span class="nav-label">{{item.label}}</span></button> }
</div></nav>
<main>
@if (section() === 'inicio') {
  <section class="hero" [class.controls-visible]="controlsVisible()" (click)="revealControls()"><img [src]="slides[slide()]" alt="Colección STUDIO F"><button class="arrow prev" aria-label="Anterior" (click)="move(-1)">‹</button><button class="arrow next" aria-label="Siguiente" (click)="move(1)">›</button><div class="dots">@for (image of slides; track image; let i = $index) { <button [class.selected]="i === slide()" [attr.aria-label]="'Diapositiva ' + (i + 1)" (click)="slide.set(i)"></button> }</div></section>
} @else if (section() === 'cuenta') {
  <section class="panel account-panel" [class.account-panel-wide]="accountUser()">
    @if (accountUser(); as account) {
      <div class="account-dashboard">
        <div class="account-layout">
          <aside class="account-sidebar" aria-label="Menú de cuenta">
            <div class="account-sidebar-heading"><span class="eyebrow">CLUB STUDIO F</span><strong>MI CUENTA</strong></div>
            <nav aria-label="Secciones de mi cuenta">
              @for (item of visibleAccountNavigation(); track item.id) {
                <button type="button" [class.active]="accountSection() === item.id" [attr.aria-current]="accountSection() === item.id ? 'page' : null" (click)="openAccountSection(item.id)">
                  <span aria-hidden="true">{{item.icon}}</span>{{item.label}}
                </button>
              }
            </nav>
            <button class="account-logout" type="button" (click)="logout()">Cerrar sesión</button>
          </aside>
          <section class="account-main">
            <header class="account-page-heading"><div><p class="eyebrow">TU ESPACIO PERSONAL</p><h1>{{accountSectionTitle()}}</h1><p>Hola, <strong>{{account.name}}</strong></p></div>
              @if (account.availableSections.includes('puntos') && account.points !== null) { <div class="account-points-pill"><span>Saldo disponible</span><strong>{{account.points}}@if (account.pointsUnit) { {{account.pointsUnit}} }</strong></div> }
            </header>
            @switch (accountSection()) {
              @case ('inicio') {
                @if (account.pointsNotice) { <p class="account-unavailable" role="status">{{account.pointsNotice}}</p> }
                @if (account.availableSections.includes('puntos') && account.points !== null) {
                  <section class="account-data-card points-result"><p class="account-description">Saldo de puntos devuelto por el servicio.</p><div class="points-card"><span>CLUB STUDIO F</span><p>Tu saldo disponible</p><strong>{{account.points}}</strong>@if (account.pointsUnit) { <span>{{account.pointsUnit}}</span> }</div></section>
                }
              }
              @case ('puntos') {
                @if (account.availableSections.includes('puntos') && account.points !== null) {
                  <section class="account-data-card points-result"><div class="points-card"><span>CLUB STUDIO F</span><p>Tu saldo disponible</p><strong>{{account.points}}</strong>@if (account.pointsUnit) { <span>{{account.pointsUnit}}</span> }</div></section>
                }
              }
              @case ('movimientos') {
                <section class="account-data-card"><h2>Mis movimientos</h2><p class="account-unavailable">El servicio conectado todavía no ofrece movimientos de la cuenta.</p></section>
              }
              @case ('password') {
                <section class="account-data-card"><h2>Cambiar contraseña</h2><p class="account-unavailable">El servicio actual no ofrece una operación para cambiar la contraseña.</p></section>
              }
              @case ('profile') {
                <section class="account-data-card"><h2>Actualizar mis datos</h2><p class="account-unavailable">El servicio actual no ofrece consulta ni actualización del perfil.</p></section>
              }
              @case ('stores') { <section class="account-data-card"><h2>Establecimientos</h2><p class="account-unavailable">Consulta los establecimientos desde la sección pública de Studio F.</p><button class="secondary-button" type="button" (click)="navigate('establecimientos')">Ver establecimientos</button></section> }
              @case ('rewards') {
                <section class="account-data-card"><h2>Beneficios y premios</h2><p class="account-unavailable">Consulta los beneficios disponibles en la sección pública de Studio F.</p><button class="secondary-button" type="button" (click)="navigate('beneficios')">Conocer beneficios</button></section>
              }
            }
          </section>
        </div>
      </div>
    } @else {
      <div class="account-login">
        <p class="eyebrow">STUDIO F</p><h1>MI CUENTA</h1>
        <p class="muted">Ingresa con los datos de tu cuenta de lealtad.</p>
        <form class="account-form" (ngSubmit)="submitLogin()" [attr.aria-busy]="loginPending()">
          <label for="username">Nombre de usuario</label><input id="username" name="username" [(ngModel)]="username" maxlength="48" autocomplete="username" required autofocus [disabled]="loginPending()">
          <label for="password">Contraseña</label><input id="password" name="password" [(ngModel)]="password" type="password" maxlength="17" autocomplete="current-password" required [disabled]="loginPending()">
          <button class="primary" type="submit" [disabled]="loginPending()">{{loginPending() ? 'Validando…' : 'Enviar'}}</button>
        </form>
        <p class="notice" role="status" aria-live="polite">{{accountNotice()}}</p>
      </div>
      }
  </section>
} @else {
  <section class="panel content original-content" aria-live="polite">
    @if (loading()) { <p class="muted">Cargando contenido…</p> }
    @else if (loadError()) { <h2>No se pudo cargar esta sección</h2><p>{{loadError()}}</p> }
    @else { <div [innerHTML]="sectionContent()"></div> }
    @if (section() === 'contacto' && !loading() && !loadError()) {
      <form class="contact-form" (ngSubmit)="submitContact()">
        <h2>Envíanos tu consulta</h2><div class="form-grid">
          <label>Nombres<input name="contactName" [(ngModel)]="contactName" required autocomplete="given-name"></label>
          <label>Apellidos<input name="contactLastName" [(ngModel)]="contactLastName" required autocomplete="family-name"></label>
          <label>Teléfono<input name="contactPhone" [(ngModel)]="contactPhone" type="tel" autocomplete="tel"></label>
          <label>Correo electrónico<input name="contactEmail" [(ngModel)]="contactEmail" type="email" required autocomplete="email"></label>
          <label>N.º de tarjeta de cliente<input name="contactCard" [(ngModel)]="contactCard"></label>
          <label class="message-field">Mensaje<textarea name="contactMessage" [(ngModel)]="contactMessage" rows="4" required></textarea></label>
        </div><button class="primary" type="submit">Enviar</button><p class="notice" aria-live="polite">{{contactNotice()}}</p>
      </form>
    }
    @if (section() === 'contacto') { <p class="backend">El formulario valida los campos en esta página, pero para enviar la consulta es necesario conectar el servicio original.</p> }
  </section>
}
</main>
<footer><div><img src="./img/logo/logo_studiof_footer.jpg" alt="STUDIO F"><span>Todos los derechos reservados</span></div><img class="datacode" src="./img/DATACODE.png" alt="Datacode"></footer>
` })
export class AppComponent implements OnDestroy {
  readonly navigation: { id: Section; label: string }[] = [
    { id: 'inicio', label: 'INICIO' }, { id: 'acerca', label: 'ACERCA DE' }, { id: 'beneficios', label: 'BENEFICIOS' }, { id: 'politicas', label: 'POLÍTICAS' }, { id: 'establecimientos', label: 'ESTABLECIMIENTOS' }, { id: 'cuenta', label: 'MI CUENTA' }, { id: 'contacto', label: 'CONTÁCTANOS' }
  ];
  private readonly contentFiles: Partial<Record<Section, string>> = {
    acerca: 'acerca', beneficios: 'politicas', politicas: 'condiciones', establecimientos: 'establecimientos', contacto: 'contacto'
  };
  readonly slides = ['./img/slider/SLIDE4.png', './img/slider/SLIDE2.png', './img/slider/SLIDE3.png', './img/slider/SLIDE1.png'];
  readonly accountNavigation: { id: AccountSection; label: string; icon: string }[] = [
    { id: 'inicio', label: 'Inicio', icon: '⌂' },
    { id: 'puntos', label: 'Mis puntos', icon: '☆' },
    { id: 'movimientos', label: 'Mis movimientos', icon: '↔' },
    { id: 'password', label: 'Cambiar contraseña', icon: '◇' },
    { id: 'profile', label: 'Actualizar datos', icon: '○' },
    { id: 'stores', label: 'Establecimientos', icon: '⌖' },
    { id: 'rewards', label: 'Beneficios y premios', icon: '☆' }
  ];
  readonly section = signal<Section>('inicio');
  readonly slide = signal(0);
  readonly controlsVisible = signal(false);
  readonly loading = signal(false);
  readonly sectionContent = signal('');
  readonly loadError = signal('');
  readonly accountNotice = signal('');
  readonly accountUser = signal<{ name: string; points: string | null; pointsUnit: string | null; pointsNotice: string | null; availableSections: AccountSection[] } | null>(null);
  readonly accountSection = signal<AccountSection>('inicio');
  readonly loginPending = signal(false);
  readonly contactNotice = signal('');
  username = '';
  password = '';
  contactName = '';
  contactLastName = '';
  contactPhone = '';
  contactEmail = '';
  contactCard = '';
  contactMessage = '';
  private contentRequest = 0;
  private slideTimer?: number;

  constructor() {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.slideTimer = window.setInterval(() => {
        if (this.section() === 'inicio' && !document.hidden) this.move(1);
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.slideTimer !== undefined) window.clearInterval(this.slideTimer);
  }

  revealControls(): void { this.controlsVisible.set(true); }

  async navigate(section: Section): Promise<void> {
    const requestId = ++this.contentRequest;
    this.section.set(section);
    if (section !== 'inicio') this.controlsVisible.set(false);
    this.sectionContent.set('');
    this.loadError.set('');
    this.accountNotice.set('');
    this.contactNotice.set('');
    const page = this.contentFiles[section];
    this.loading.set(Boolean(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!page) return;
    const url = new URL(`./contenido/${page}.html`, document.baseURI);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} al leer ${url.pathname}`);
      let html = await response.text();
      if (requestId !== this.contentRequest) return;
      if (section === 'contacto') html = html.replace(/<form\b[^>]*>[\s\S]*?<\/form\s*>/gi, '');
      this.sectionContent.set(html);
    } catch (error) {
      if (requestId !== this.contentRequest) return;
      this.loadError.set(error instanceof Error ? error.message : 'Error leyendo el archivo local.');
    } finally {
      if (requestId === this.contentRequest) this.loading.set(false);
    }
  }

  move(direction: number): void { this.slide.update(index => (index + direction + this.slides.length) % this.slides.length); }
  async submitLogin(): Promise<void> {
    this.loginPending.set(true);
    this.accountNotice.set('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username, password: this.password })
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = this.isRecord(payload) && typeof payload['message'] === 'string'
          ? payload['message']
          : 'No fue posible validar la cuenta.';
        this.accountNotice.set(message);
        return;
      }
      if (
        !this.isRecord(payload)
        || typeof payload['name'] !== 'string'
        || !Array.isArray(payload['availableSections'])
      ) {
        throw new Error('La respuesta del servicio no tiene el formato esperado.');
      }
      const availableSections: AccountSection[] = [];
      for (const section of payload['availableSections']) {
        if (!this.isAccountSection(section)) {
          throw new Error('La respuesta del servicio contiene una sección desconocida.');
        }
        availableSections.push(section);
      }
      const points = typeof payload['points'] === 'string' ? payload['points'] : null;
      if (!availableSections.includes('inicio') || (availableSections.includes('puntos') && points === null)) {
        throw new Error('La respuesta del servicio contiene secciones sin datos asociados.');
      }
      this.accountUser.set({
        name: payload['name'],
        points,
        pointsUnit: typeof payload['pointsUnit'] === 'string' ? payload['pointsUnit'] : null,
        pointsNotice: typeof payload['pointsNotice'] === 'string' ? payload['pointsNotice'] : null,
        availableSections
      });
      this.accountSection.set('inicio');
      this.password = '';
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      this.accountNotice.set('No fue posible conectar con el servicio de autenticación. Inténtalo nuevamente.');
    } finally {
      this.loginPending.set(false);
    }
  }

  logout(): void {
    this.accountUser.set(null);
    this.accountSection.set('inicio');
    this.username = '';
    this.password = '';
    this.accountNotice.set('');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isAccountSection(value: unknown): value is AccountSection {
    return typeof value === 'string' && this.accountNavigation.some(item => item.id === value);
  }

  visibleAccountNavigation(): typeof this.accountNavigation {
    const account = this.accountUser();
    if (!account) return [];
    return this.accountNavigation.filter(item => account.availableSections.includes(item.id));
  }

  openAccountSection(section: AccountSection): void {
    const account = this.accountUser();
    if (!account?.availableSections.includes(section)) return;
    this.accountSection.set(section);
  }

  accountSectionTitle(): string {
    return this.accountNavigation.find(item => item.id === this.accountSection())?.label ?? 'Mi cuenta';
  }

  submitContact(): void { this.contactNotice.set('Los campos son válidos. La consulta no se envió porque el servicio original no está conectado.'); }
}

bootstrapApplication(AppComponent).catch(error => console.error(error));
