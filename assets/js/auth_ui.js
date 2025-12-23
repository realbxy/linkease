(function () {
    async function fetchMe() {
        try {
            const res = await fetch('/me', { credentials: 'same-origin' });
            if (!res.ok) return null;
            const data = await res.json();
            return data || null;
        } catch {
            return null;
        }
    }

    function ensureAuthStyles() {
        if (document.getElementById('auth-ui-styles')) return;

        const style = document.createElement('style');
        style.id = 'auth-ui-styles';
        style.textContent = `
          .auth-wrap {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .auth-title {
            font-weight: 600;
            font-size: 14px;
            color: #fff;
            margin: 0 0 6px 0;
          }
          .auth-sub {
            font-size: 12px;
            line-height: 1.35;
            color: rgba(255,255,255,.72);
            margin: 0 0 12px 0;
          }
          .auth-row { display:flex; align-items:stretch; }
          .auth-btn {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px 14px;
            border: 1px solid rgba(255,255,255,.14);
            background: rgba(255,255,255,.08);
            color: #fff;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: .1px;
            cursor: pointer;
            border-radius: 0;
            box-shadow: 0 6px 14px rgba(0,0,0,0.28);
            transition: transform .12s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
          }
          .auth-btn:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,.12);
            border-color: rgba(255,255,255,.22);
            box-shadow: 0 10px 22px rgba(0,0,0,0.35);
          }
          .auth-btn:active { transform: translateY(0px); }
          .auth-ic {
            width: 18px;
            height: 18px;
            object-fit: contain;
            filter: brightness(0) invert(1);
            opacity: .95;
            display: inline-block;
          }

          .auth-logout-top {
            position: absolute;
            top: 6px;
            right: 6px;
            font-size: 12px;
            color: rgba(255,255,255,.70);
            text-decoration: none;
            padding: 6px 8px;
            border: 1px solid rgba(255,255,255,.12);
            background: rgba(255,255,255,.06);
            border-radius: 0;
            cursor: pointer;
          }
          .auth-logout-top:hover {
            color: #fff;
            background: rgba(255,255,255,.10);
            border-color: rgba(255,255,255,.20);
          }
        `;
        document.head.appendChild(style);
    }

    function sanitizeDiscordName(username) {
        if (!username) return 'Discord User';
        return String(username).replace(/#\d{1,4}$/, '');
    }

    function loggedOutMarkup(buttonId) {
        const discordIcon = 'assets/tabicons/logos/discord.png';
        return `
          <div class="auth-wrap">
            <div class="auth-title">Login with Discord to save your progress</div>
            <div class="auth-sub">
              Your Discord name will be shown in-game and your account can store XP, perks, hats, etc.
            </div>
            <div class="auth-row">
              <button id="${buttonId}" class="auth-btn" type="button">
                <img src="${discordIcon}" alt="Discord" class="auth-ic" />
                Login with Discord
              </button>
            </div>
          </div>
        `;
    }

    function renderLoggedOutInProfile(container, popupHandler) {
        ensureAuthStyles();
        const inner = container.querySelector('div[style*="position: relative"]') || container;
        inner.innerHTML = loggedOutMarkup('discord-login-btn');
        const btn = inner.querySelector('#discord-login-btn');
        if (btn) btn.addEventListener('click', popupHandler);
    }

    function renderLoggedOut(bodyEl, popupHandler) {
        ensureAuthStyles();
        bodyEl.innerHTML = loggedOutMarkup('discord-login-btn-fallback');
        const btn = bodyEl.querySelector('#discord-login-btn-fallback');
        if (btn) btn.addEventListener('click', popupHandler);
    }

    function renderLoggedInInProfile(container, data) {
        ensureAuthStyles();
        const inner = container.querySelector('div[style*="position: relative"]') || container;

        const total = (data.total_xp ?? data.totalXp ?? 0);
        const season = (data.season_xp ?? data.seasonXp ?? 0);
        const level = (data.level ?? 0);
        const nextXp = (data.next_level_xp ?? 0);
        const startXp = (data.level_start_xp ?? 0);

        const displayName = sanitizeDiscordName(data.username);

        const denom = Math.max(1, (nextXp - startXp));
        const pct = Math.max(0, Math.min(1, (total - startXp) / denom));
        const pctStr = (pct * 100).toFixed(1) + '%';

        // Thicker bar + nicer spacing
        const barHeight = 22;     // bigger
        const barBottom = 26;     // keep distance from bottom labels

        inner.innerHTML = `
          <div style="position: relative; height:100%;">
            <a class="auth-logout-top" href="/logout" title="Logout">Logout</a>

            <div style="display:flex; gap:12px; align-items:flex-start; padding-right:72px;">
              <!-- square avatar -->
              <div class="profile-picture"
                   style="
                     width:70px;height:70px;
                     border-radius:3px;
                     background-size:cover;background-position:center;
                     background-color:rgba(255,255,255,0.06);
                     border:1px solid rgba(255,255,255,0.12);
                     flex:0 0 auto;
                   ">
              </div>

              <div style="display:flex; flex-direction:column; gap:6px; min-width:0; padding-top:2px;">
                <div style="font-weight:600;color:#fff;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${displayName}
                </div>

                <div style="display:flex; flex-direction:column; gap:4px;">
                  <div style="font-size:12px; color:rgba(255,255,255,0.72);">
                    <span style="color:#fff; opacity:.95;">${Number(total).toLocaleString()}</span>
                    <span style="opacity:.75;"> total XP</span>
                  </div>
                  <div style="font-size:12px; color:rgba(255,255,255,0.72);">
                    <span style="color:#fff; opacity:.95;">${Number(season).toLocaleString()}</span>
                    <span style="opacity:.75;"> season XP</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- progress bar -->
            <div style="
                position:absolute; left:0; right:0; bottom:${barBottom}px;
                background:rgba(255,255,255,0.08);
                overflow:hidden;
                height:${barHeight}px;
                border:1px solid rgba(255,255,255,0.12);
              ">
              <div style="width:${pctStr}; background:rgba(255,255,255,0.85); height:100%;"></div>
            </div>

            <!-- bottom labels -->
            <div style="
                position:absolute; left:0; right:0; bottom:0;
                font-size:12px;
                display:flex; justify-content:space-between;
                color:rgba(255,255,255,0.60);
              ">
              <span>Level ${level}</span>
              <span>${Number(nextXp).toLocaleString()}</span>
            </div>
          </div>
        `;

        const pic = inner.querySelector('.profile-picture');
        if (pic) pic.style.backgroundImage = `url(${data.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'})`;
    }

    function renderLoggedIn(bodyEl, data) {
        // Fallback renderer (only used if profile-card not found)
        bodyEl.innerHTML = '';

        const displayName = sanitizeDiscordName(data.username);

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '10px';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '10px';

        const img = document.createElement('div');
        img.style.width = '48px';
        img.style.height = '48px';
        img.style.borderRadius = '0';
        img.style.border = '1px solid rgba(255,255,255,0.12)';
        img.style.backgroundColor = 'rgba(255,255,255,0.06)';
        img.style.backgroundImage = `url(${data.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'})`;
        img.style.backgroundSize = 'cover';
        img.style.backgroundPosition = 'center';

        const name = document.createElement('div');
        name.style.fontWeight = '700';
        name.textContent = displayName;

        const logout = document.createElement('a');
        logout.href = '/logout';
        logout.textContent = 'Logout';
        logout.style.color = 'rgba(255,255,255,.75)';
        logout.style.textDecoration = 'none';
        logout.style.border = '1px solid rgba(255,255,255,.12)';
        logout.style.background = 'rgba(255,255,255,.06)';
        logout.style.padding = '6px 8px';

        left.appendChild(img);
        left.appendChild(name);

        row.appendChild(left);
        row.appendChild(logout);
        bodyEl.appendChild(row);
    }

    function openPopupAndPollFactory(getInserted) {
        return function openPopupAndPoll() {
            const popup = window.open('/auth/discord', 'discord_oauth', 'width=500,height=700');
            if (!popup) return alert('Popup blocked. Please allow popups for this site.');

            const poll = setInterval(async () => {
                const me = await fetchMe();
                if (me) {
                    clearInterval(poll);
                    try { popup.close(); } catch { }

                    const el = getInserted();
                    if (!el) return;

                    if (el.classList && el.classList.contains('profile-card') && !el.querySelector('.auth-body')) {
                        renderLoggedInInProfile(el, me);
                    } else {
                        const body = el.querySelector('.auth-body');
                        if (body) renderLoggedIn(body, me);
                    }
                }
            }, 900);
        };
    }

    let inserted = null;

    function createCard() {
        const card = document.createElement('div');
        card.className = 'glass-card profile-card';
        card.style.padding = '12px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '8px';

        const header = document.createElement('div');
        header.style.fontSize = '14px';
        header.style.fontWeight = '700';
        header.textContent = 'Account';

        const body = document.createElement('div');
        body.className = 'auth-body';

        card.appendChild(header);
        card.appendChild(body);
        return card;
    }

    async function init() {
        ensureAuthStyles();
        const popupHandler = openPopupAndPollFactory(() => inserted);

        const existingProfile = document.querySelector('.profile-card');
        if (existingProfile) {
            inserted = existingProfile;
            const me = await fetchMe();
            if (!me) renderLoggedOutInProfile(inserted, popupHandler);
            else renderLoggedInInProfile(inserted, me);
            return;
        }

        const target = document.querySelector('.glass-card') || document.getElementById('overlays') || document.body;
        const card = createCard();
        if (target === document.body) document.body.insertBefore(card, document.body.firstChild);
        else target.appendChild(card);

        inserted = card;
        const body = card.querySelector('.auth-body');
        const me = await fetchMe();
        if (!me) renderLoggedOut(body, popupHandler);
        else renderLoggedIn(body, me);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
