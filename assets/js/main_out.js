(function(wHandle, wjQuery) {
    "use strict";
    if (!Date.now) Date.now = function() {
        return (+new Date()).getTime();
    }
    let DATE = Date.now();
    Array.prototype.remove = function(a) {
        const i = this.indexOf(a);
        return i !== -1 && this.splice(i, 1);
    }
    function bytesToColor(r, g, b) {
        let r1 = ("00" + (~~r).toString(16)).slice(-2),
            g1 = ("00" + (~~g).toString(16)).slice(-2),
            b1 = ("00" + (~~b).toString(16)).slice(-2);
        return `#${r1}${g1}${b1}`;
    }
    function colorToBytes(color) {
        if (color.length === 4) return {
            r: parseInt(color[1] + color[1], 16),
            g: parseInt(color[2] + color[2], 16),
            b: parseInt(color[3] + color[3], 16)
        };
        else if (color.length === 7) return {
            r: parseInt(color[1] + color[2], 16),
            g: parseInt(color[3] + color[4], 16),
            b: parseInt(color[5] + color[6], 16)
        };
        throw new Error(`Invalid color: ${color}!`);
    }
    function darkenColor(color) {
        let c = colorToBytes(color);
        return bytesToColor(c.r * .9, c.g * .9, c.b * .9);
    }
    function cleanupObject(object) {
        for (let i in object) delete object[i];
    }
    function clampNumber(value, min, max) {
        const num = Number(value);
        const safeNum = isNaN(num) ? 0 : num;
        return Math.min(Math.max(safeNum, min), max);
    }
    // Rounded rect helper for canvas
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
        };
    }
    function appendDomChatMessage(entry) {
        if (!domChatList || !entry) return;
        const row = document.createElement("div");
        row.className = "chatbox-message" + (entry.system ? " system" : "");
        const sender = document.createElement("span");
        sender.className = "sender";
        sender.textContent = (entry.name || "").trim() + (entry.name ? ":" : "");
        // Choose sender color: system tint, else explicit self flag uses own picker, else entry-provided/white.
        let chosenColor = "#ffffff";
        if (entry.system) {
            chosenColor = "#9aa0b5";
        } else {
            let selfColor = "#ffffff";
            try { selfColor = resolveNameColor(); } catch (e) {}
            const isSelf = !!entry.isSelf || !!entry.self;
            if (isSelf) chosenColor = selfColor;
            else if (entry.color) chosenColor = entry.color;
        }
        sender.style.color = chosenColor;
        const text = document.createElement("span");
        text.className = "text";
        text.textContent = entry.message || "";
        row.appendChild(sender);
        row.appendChild(text);
        domChatList.appendChild(row);
        // Trim to last 50 messages
        while (domChatList.childElementCount > 50) {
            domChatList.removeChild(domChatList.firstChild);
        }
        domChatList.scrollTop = domChatList.scrollHeight;
    }
    class Writer {
        constructor(littleEndian) {
            this.writer = true;
            this.tmpBuf = new DataView(new ArrayBuffer(8));
            this._e = littleEndian;
            this.reset();
            return this;
        }
        reset(littleEndian = this._e) {
            this._e = littleEndian;
            this._b = [];
            this._o = 0;
        }
        setUint8(a) {
            if (a >= 0 && a < 256) this._b.push(a);
            return this;
        }
        setInt8(a) {
            if (a >= -128 && a < 128) this._b.push(a);
            return this;
        }
        setUint16(a) {
            this.tmpBuf.setUint16(0, a, this._e);
            this.move(2);
            return this;
        }
        setInt16(a) {
            this.tmpBuf.setInt16(0, a, this._e);
            this.move(2);
            return this;
        }
        setUint32(a) {
            this.tmpBuf.setUint32(0, a, this._e);
            this._move(4);
            return this;
        }
        setInt32(a) {
            this.tmpBuf.setInt32(0, a, this._e);
            this._move(4);
            return this;
        }
        setFloat32(a) {
            this.tmpBuf.setFloat32(0, a, this._e);
            this._move(4);
            return this;
        }
        setFloat64(a) {
            this.tmpBuf.setFloat64(0, a, this._e);
            this._move(8);
            return this;
        }
        _move(b) {
            for (let i = 0; i < b; i++) this._b.push(this.tmpBuf.getUint8(i));
        }
        setStringUTF8(s) {
            const bytesStr = unescape(encodeURIComponent(s));
            for (let i = 0, l = bytesStr.length; i < l; i++) this._b.push(bytesStr.charCodeAt(i));
            this._b.push(0);
            return this;
        }
        build() {
            return new Uint8Array(this._b);
        }
    }
    class Reader {
        constructor(view, offset, littleEndian) {
            this.reader = true;
            this._e = littleEndian;
            if (view) this.repurpose(view, offset);
        }
        repurpose(view, offset) {
            this.view = view;
            this._o = offset || 0;
        }
        getUint8() {
            return this.view.getUint8(this._o++, this._e);
        }
        getInt8() {
            return this.view.getInt8(this._o++, this._e);
        }
        getUint16() {
            return this.view.getUint16((this._o += 2) - 2, this._e);
        }
        getInt16() {
            return this.view.getInt16((this._o += 2) - 2, this._e);
        }
        getUint32() {
            return this.view.getUint32((this._o += 4) - 4, this._e);
        }
        getInt32() {
            return this.view.getInt32((this._o += 4) - 4, this._e);
        }
        getFloat32() {
            return this.view.getFloat32((this._o += 4) - 4, this._e);
        }
        getFloat64() {
            return this.view.getFloat64((this._o += 8) - 8, this._e);
        }
        getStringUTF8() {
            let s = "",
                b;
            while ((b = this.view.getUint8(this._o++)) !== 0) s += String.fromCharCode(b);
            return decodeURIComponent(escape(s));
        }
    }
    class Logger {
        constructor() {
            this.verbosity = 4;
        }
        error(text) {
            if (this.verbosity > 0) console.error(text);
        }
        warn(text) {
            if (this.verbosity > 1) console.warn(text);
        }
        info(text) {
            if (this.verbosity > 2) console.info(text);
        }
        debug(text) {
            if (this.verbosity > 3) console.debug(text);
        }
    }
    class Sound {
        constructor(src, volume, maximum) {
            this.src = src;
            this.volume = typeof volume === "number" ? volume : 0.5;
            this.maximum = typeof maximum === "number" ? maximum : Infinity;
            this.elms = [];
        }
        play(vol) {
            if (typeof vol === "number") this.volume = vol;
            let toPlay = this.elms.find((elm) => elm.paused) ?? this.add();
            toPlay.volume = this.volume;
            toPlay.play();
        }
        add() {
            if (this.elms.length >= this.maximum) return this.elms[0];
            let elm = new Audio(this.src);
            this.elms.push(elm);
            return elm;
        }
    }
    let log = new Logger(),
        SKIN_URL = "./skins/",
        USE_HTTPS = "https:" == wHandle.location.protocol,
        DEFAULT_WSS = "wss://game.linkease.me",
        CELL_POINTS_MIN = 5,
        CELL_POINTS_MAX = 120,
        PI_2 = Math.PI * 2,
        UINT8_254 = new Uint8Array([254, 6, 0, 0, 0]),
        UINT8_255 = new Uint8Array([255, 1, 0, 0, 0]),
        UINT8 = {
            1: new Uint8Array([1]),
            17: new Uint8Array([17]),
            21: new Uint8Array([21]),
            18: new Uint8Array([18]),
            19: new Uint8Array([19]),
            22: new Uint8Array([22]),
            23: new Uint8Array([23]),
            24: new Uint8Array([24]),
            25: new Uint8Array([25]),
            26: new Uint8Array([26]),
            27: new Uint8Array([27]),
            28: new Uint8Array([28]),
            30: new Uint8Array([30]),
            31: new Uint8Array([31]),
            29: new Uint8Array([29]),
            33: new Uint8Array([33]),
            34: new Uint8Array([34]),
            35: new Uint8Array([35]),
            36: new Uint8Array([36]),
            37: new Uint8Array([37]),
            38: new Uint8Array([38]),
            39: new Uint8Array([39]),
            40: new Uint8Array([40]),
            41: new Uint8Array([41]),
            42: new Uint8Array([42]),
            43: new Uint8Array([43]),
            45: new Uint8Array([45]),
            254: new Uint8Array([254])
        },
        cells = Object.create({
            mine: [],
            byId: {},
            list: [],
        }),
        border = Object.create({
            left: -2000,
            right: 2000,
            top: -2000,
            bottom: 2000,
            width: 4000,
            height: 4000,
            centerX: -1,
            centerY: -1
        }),
        leaderboard = Object.create({
            type: NaN,
            items: null,
            canvas: document.createElement("canvas"),
            teams: ["#F33", "#3F3", "#33F"]
        }),
        chat = Object.create({
            messages: [],
            waitUntil: 0,
            canvas: document.createElement("canvas"),
            visible: 0,
        }),
        stats = Object.create({
            framesPerSecond: 0,
            latency: NaN,
            supports: null,
            info: null,
            pingLoopId: NaN,
            pingLoopStamp: null,
            canvas: document.createElement("canvas"),
            visible: 0,
            score: NaN,
            maxScore: 0
        }),
        minimapSmooth = new Map(),
        ghostCells = new Map(),
        lastSeenCells = new Map(),
        hudFpsSmooth = 0,
        domChatList = null,
        ws = null,
        WS_URL = DEFAULT_WSS,
        isConnected = 0,
        disconnectDelay = 1000,
        syncUpdStamp = Date.now(),
        syncAppStamp = Date.now(),
        mainCanvas = null,
        mainCtx = null,
        soundsVolume,
        loadedSkins = {},
        overlayShown = 0,
        isTyping = 0,
        chatBox = null,
        opModeDetected = false,
        idLookupSelecting = false,
        mapCenterSet = 0,
        camera = {
            x: 0,
            y: 0,
            z: 1,
            zScale: 1,
            viewMult: 1
        },
        target = {
            x: 0,
            y: 0,
            z: 1
        },
        cameraTargetBuffer = [{t: Date.now(), x: 0, y: 0, z: 1}],
        lastCameraFrame = Date.now(),
        autoRespawnArmed = false,
        autoRespawnTimeout = null,
        hasSpawnedOnce = false,
        mouse = {
            x: NaN,
            y: NaN,
            z: 1
        },
        frozenMousePos = null,
        frozenMouseUntil = 0,
        settings = {
            mobile: "createTouch" in document,
            showSkins: true,
            showOtherSkins: true,
            showNames: true,
            showOtherNames: true,
            showColor: true,
            hideChat: false,
            showMinimap: true,
            hideGrid: false,
            hideFood: false,
            hideStats: false,
            showMass: false,
            darkTheme: false,
            cellBorders: false,
            jellyPhysics: false,
            showTextOutline: true,
            infiniteZoom: false,
            transparency: false,
            mapBorders: false,
            sectors: false,
            showPos: false,
            autoZoom: false,
            autoRespawn: false,
            drawDelayMs: 120,
            cameraPanSpeed: 22,
            cameraZoomSpeed: 14,
            scrollZoomRate: 100,
            allowGETipSet: false
        },
        // expose settings for UI syncing outside this closure
        __exposeSettings = (function () { try { wHandle.__clientSettings = settings; } catch (e) {} })(),
        // preload saved checkbox states into settings before UI sync
        applySavedSettingsFromStorage = (function() {
            try {
                if (wHandle.localStorage == null) return;
                const getBool = (id) => {
                    const v = wHandle.localStorage.getItem("checkbox-" + id);
                    if (v === null) return undefined;
                    return v === "true";
                };
                const v1 = getBool(1); if (v1 !== undefined) settings.showSkins = v1;
                const v2 = getBool(2); if (v2 !== undefined) settings.showNames = v2;
                const v19 = getBool(19); if (v19 !== undefined) settings.showOtherSkins = v19;
                const v20 = getBool(20); if (v20 !== undefined) settings.showOtherNames = v20;
                const v4 = getBool(4);
                if (v4 !== true) {
                    settings.showColor = true;
                    try { wHandle.localStorage.setItem("checkbox-4", "true"); } catch (e) {}
                } else {
                    settings.showColor = true;
                }
                const v5 = getBool(5); if (v5 !== undefined) settings.showMass = v5;
                const v9 = getBool(9); if (v9 !== undefined) settings.cellBorders = v9;
                const v18 = getBool(18); if (v18 !== undefined) settings.jellyPhysics = v18;
                const v16 = getBool(16); if (v16 !== undefined) settings.showTextOutline = v16;
                const v11 = getBool(11); if (v11 !== undefined) settings.infiniteZoom = v11;
                const v12 = getBool(12); if (v12 !== undefined) settings.transparency = v12;
                const v17 = getBool(17); if (v17 !== undefined) settings.hideFood = v17;
                const v7 = getBool(7); if (v7 !== undefined) settings.hideChat = !v7;
                const v8 = getBool(8); if (v8 !== undefined) settings.showMinimap = v8;
                const v10 = getBool(10); if (v10 !== undefined) settings.hideGrid = !v10;
                const v14 = getBool(14); if (v14 !== undefined) settings.mapBorders = v14;
                const v15 = getBool(15); if (v15 !== undefined) settings.sectors = v15;
                const v13 = getBool(13); if (v13 !== undefined) settings.hideStats = !v13;
                const v3 = getBool(3); if (v3 !== undefined) settings.darkTheme = v3;
                const v21 = getBool(21); if (v21 !== undefined) settings.autoZoom = v21;
                const v22 = getBool(22); if (v22 !== undefined) settings.autoRespawn = v22;
                const drawDelay = wHandle.localStorage.getItem("mo_drawDelay");
                if (drawDelay !== null && !isNaN(parseFloat(drawDelay))) settings.drawDelayMs = Math.max(0, Math.min(400, parseFloat(drawDelay)));
                const panSpeed = wHandle.localStorage.getItem("mo_cameraPan");
                if (panSpeed !== null && !isNaN(parseFloat(panSpeed))) settings.cameraPanSpeed = Math.max(1, Math.min(200, parseFloat(panSpeed)));
                const zoomSpeed = wHandle.localStorage.getItem("mo_cameraZoom");
                if (zoomSpeed !== null && !isNaN(parseFloat(zoomSpeed))) settings.cameraZoomSpeed = Math.max(1, Math.min(200, parseFloat(zoomSpeed)));
                const scrollRate = wHandle.localStorage.getItem("mo_scrollZoomRate");
                if (scrollRate !== null && !isNaN(parseFloat(scrollRate))) settings.scrollZoomRate = Math.max(10, Math.min(400, parseFloat(scrollRate)));
            } catch (e) {}
        })(),
        pressed = {
            space: 0,
            w: 0,
            e: 0,
            r: 0,
            t: 0,
            p: 0,
            q: 0,
            o: 0,
            m: 0,
            i: 0,
            y: 0,
            u: 0,
            k: 0,
            l: 0,
            h: 0,
            z: 0,
            x: 0,
            s: 0,
            c: 0,
            g: 0,
            j: 0,
            b: 0,
            v: 0,
            n: 0,
            esc: 0
        },
        eatSound = new Sound("./assets/sound/eat.mp3", .5, 10),
        pelletSound = new Sound("./assets/sound/pellet.mp3", .5, 10);
    const HAT_OPACITY = 0.85;
    const HAT_PRESETS = {
        crown: "https://i.postimg.cc/sxZD5jJn/crown.png",
        irish: "http://i.imgur.com/5kTy39Y.png",
        penguin: "http://i.imgur.com/L0dCOQb.png",
        yt: "http://i.imgur.com/nNUCSh2.png",
        troll: "http://i.imgur.com/xZiAA18.png",
        santa: "http://i.imgur.com/lw85cSt.png",
        pika: "http://i.imgur.com/8qgs5zI.png",
        vintage: "https://i.imgur.com/3dSkHkx.png",
        wizard: "https://i.imgur.com/QCCBfqH.png",
        trex: "https://i.imgur.com/fmos4Vy.png",
        kk: "https://i.imgur.com/Qat1KKA.png",
        kk2: "https://i.imgur.com/miRxB9s.png"
    };
    const hatImages = {};
    function normalizeNameColor(raw) {
        let hex = (raw || "").trim();
        if (!hex) return "";
        if (hex[0] === "#") hex = hex.slice(1);
        if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hex)) return "";
        if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
        return hex.toUpperCase();
    }
    function buildHatCode(rawHat) {
        const hat = (rawHat || "").trim();
        if (!hat) return "";
        if (/^u:/i.test(hat)) return "u:" + hat.slice(2);
        if (/^[a-z0-9_-]+$/i.test(hat)) return hat.toLowerCase();
        // If it looks like a URL (or protocol-relative), keep it verbatim as user-provided.
        if (/^https?:\/\//i.test(hat) || /^\/\//.test(hat)) return "u:" + hat;
        // Fallback: treat as url-ish text without encoding (shorter for name length limits).
        return "u:" + hat;
    }
    function resolveHatUrlFromCode(code) {
        if (!code) return null;
        if (code.startsWith("u:")) {
            const encoded = code.slice(2);
            try {
                // if it was encoded before, decode; otherwise passthrough
                const maybeDecoded = /%[0-9A-F]{2}/i.test(encoded) ? decodeURIComponent(encoded) : encoded;
                if (/^\/\//.test(maybeDecoded)) return (USE_HTTPS ? "https:" : "http:") + maybeDecoded;
                if (!/^https?:\/\//i.test(maybeDecoded)) return (USE_HTTPS ? "https://" : "http://") + maybeDecoded;
                return maybeDecoded;
            } catch (e) {
                if (!/^https?:\/\//i.test(encoded)) return (USE_HTTPS ? "https://" : "http://") + encoded;
                return encoded;
            }
        }
        return HAT_PRESETS[code.toLowerCase()] || null;
    }
    function getHatImageFromCode(code) {
        const url = resolveHatUrlFromCode(code);
        if (!url) return null;
        if (hatImages[code] === false) return null; // permanently failed once
        if (!hatImages[code]) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onerror = function() {
                // Retry once without crossOrigin in case CORS blocks anonymous fetch.
                if (img.crossOrigin) {
                    img.crossOrigin = null;
                    img.src = url;
                } else {
                    hatImages[code] = false;
                }
            };
            img.src = url;
            hatImages[code] = img;
        }
        return hatImages[code];
    }
    function extractHatFromName(value) {
        let nameStr = value || "";
        let hatCode = null;
        let nameColor = null;
        const match = /\$(u:[^$]+|[a-zA-Z0-9_-]+)$/.exec(nameStr);
        if (match) {
            hatCode = match[1];
            nameStr = nameStr.slice(0, match.index);
        }
        const colorMatch = /#c([0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)$/i.exec(nameStr.trim());
        if (colorMatch) {
            nameColor = normalizeNameColor(colorMatch[1]);
            nameStr = nameStr.slice(0, colorMatch.index);
        }
        return {name: nameStr.trim(), hatCode: hatCode, nameColor: nameColor};
    }
    function formatNickSkinHat(nick, skin, hatRaw, nameColorRaw) {
        const name = (nick || "").trim();
        const skinVal = (skin || "").trim();
        const hatCode = buildHatCode(hatRaw);
        const nameColor = normalizeNameColor(nameColorRaw);
        let payload = name;
        if (nameColor) payload = `${payload}#c${nameColor}`;
        if (hatCode) payload = `${payload}$${hatCode}`;
        if (skinVal) payload = `{${skinVal}}${payload}`;
        return payload;
    }
    function wsCleanup() {
        if (!ws) return;
        log.debug("WS cleanup triggered!");
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
        ws = null;
    }
    function resolveWsUrl(rawUrl) {
        if (!rawUrl) return DEFAULT_WSS;
        if (/^wss?:\/\//i.test(rawUrl)) return rawUrl;
        const protocol = USE_HTTPS && !rawUrl.includes("127.0.0.1") ? "wss" : "ws";
        return `${protocol}://${rawUrl}`;
    }
    function wsInit(url) {
        if (ws) {
            log.debug("websocket init on existing connection!");
            wsCleanup();
        }
        wjQuery("#connecting").show();
        WS_URL = resolveWsUrl(url);
        ws = new WebSocket(WS_URL);
        ws.binaryType = "arraybuffer";
        ws.onopen = wsOpen;
        ws.onmessage = wsMessage;
        ws.onerror = wsError;
        ws.onclose = wsClose;
    }
    function wsOpen() {
        isConnected = 1;
        disconnectDelay = 1000;
        wjQuery("#connecting").hide();
        wsSend(UINT8_254);
        wsSend(UINT8_255);
        log.debug(`WS connected, using https: ${USE_HTTPS}`);
        log.info("Socket open.");
    }
    function wsError(error) {
        log.error(error);
        log.info("Socket error.");
    }
    function wsClose(e) {
        isConnected = 0;
        log.debug(`WS disconnected ${e.code} '${e.reason}'`);
        wsCleanup();
        gameReset();
        setTimeout(() => {
            if (ws && ws.readyState === 1) return;
            wsInit(WS_URL);
        }, disconnectDelay *= 1.5);
        log.info("Socket closed.");
    }
    function wsSend(data) {
        if (!ws) return;
        if (ws.readyState !== 1) return;
        if (data.build) ws.send(data.build());
        else ws.send(data);
    }
    function wsMessage(data) {
        syncUpdStamp = Date.now();
        let reader = new Reader(new DataView(data.data), 0, 1),
            packetId = reader.getUint8(),
            killer,
            killed,
            id,
            x,
            y,
            s,
            flags,
            cell,
            updColor,
            updName,
            updSkin,
            count,
            color,
            name,
            skin;
        switch (packetId) {
            case 0x10: // Update nodes
                // Consume records
                count = reader.getUint16();
                for (let i = 0; i < count; i++) {
                    killer = reader.getUint32();
                    killed = reader.getUint32();
                    let _cell = cells.byId.get(killed);
                    if (!cells.byId.has(killer) || !cells.byId.has(killed)) continue;
                    if (soundsVolume.value && cells.mine.includes(killer) && syncUpdStamp - _cell.born > 100) (_cell.s < 20 ? pelletSound : eatSound).play(parseFloat(soundsVolume.value));
                    _cell.destroy(killer);
                }
                // Update records
                while (true) {
                    id = reader.getUint32();
                    if (id === 0) break;
                    x = reader.getInt32();
                    y = reader.getInt32();
                    s = reader.getUint16();
                    flags = reader.getUint8();
                    updColor = !!(flags & 0x02);
                    updName = !!(flags & 0x08);
                    updSkin = !!(flags & 0x04);
                    color = updColor ? bytesToColor(reader.getUint8(), reader.getUint8(), reader.getUint8()) : null;
                    skin = updSkin ? reader.getStringUTF8() : null;
                    name = updName ? reader.getStringUTF8() : null;
                    if (cells.byId.has(id)) {
                        cell = cells.byId.get(id);
                        cell.update(syncUpdStamp);
                        cell.updated = syncUpdStamp;
                        cell.ox = cell.x;
                        cell.oy = cell.y;
                        cell.os = cell.s;
                        cell.nx = x;
                        cell.ny = y;
                        cell.ns = s;
                        if (color) cell.setColor(color);
                        if (skin) cell.setSkin(skin);
                        if (name) cell.setName(name);
                    } else {
                        cell = new Cell(id, x, y, s, name, color, skin, flags);
                        cells.byId.set(id, cell);
                        cells.list.push(cell);
                    }
                }
                // Disappear records
                count = reader.getUint16();
                for (let i = 0; i < count; i++) {
                    killed = reader.getUint32();
                    if (cells.byId.has(killed) && !cells.byId.get(killed).destroyed) cells.byId.get(killed).destroy(null);
                }
                break;
            case 0x11: // Update position
                target.x = reader.getFloat32();
                target.y = reader.getFloat32();
                target.z = reader.getFloat32();
                break;
            case 0x12: // Clear all
                for (let cell of cells.byId.values()) cell.destroy(null);
            case 0x14: // Clear my cells
                cells.mine = [];
                autoRespawnArmed = true;
                showOverlay();
                break;
            case 0x15: // Draw line
                log.warn("Got packet 0x15 (draw line) which is unsupported!");
                break;
            case 0x20: // New cell
                cells.mine.push(reader.getUint32());
                hasSpawnedOnce = true;
                autoRespawnArmed = false;
                if (autoRespawnTimeout) {
                    clearTimeout(autoRespawnTimeout);
                    autoRespawnTimeout = null;
                }
                // If a new cell was received, ensure overlay is hidden (prevents menu popup on respawn)
                try { if (overlayShown) hideOverlay(); } catch (e) {}
                // Clear any suppress flag so overlay can show later normally
                try { window.__suppressOverlayUntil = 0; } catch (e) {}
                break;
            case 0x30: // Draw just text on a leaderboard
                leaderboard.items = [];
                leaderboard.type = "text";
                count = reader.getUint32();
                for (let i = 0; i < count; ++i) leaderboard.items.push(reader.getStringUTF8());
                drawLeaderboard();
                break;
            case 0x31: // Draw FFA leaderboard
                leaderboard.items = [];
                leaderboard.type = "ffa";
                count = reader.getUint32();
                for (let i = 0; i < count; ++i) {
                    const isMe = !!reader.getUint32();
                    const rawName = reader.getStringUTF8() || "An unnamed cell";
                    const parsedLb = extractHatFromName(rawName);
                    const cleaned = parsedLb.name || "An unnamed cell";
                    leaderboard.items.push({
                        me: isMe,
                        name: cleaned,
                        color: parsedLb.nameColor ? ("#" + parsedLb.nameColor) : null
                    });
                }
                drawLeaderboard();
                break;
            case 0x32: // Draw Teams leaderboard
                leaderboard.items = [];
                leaderboard.type = "pie";
                count = reader.getUint32();
                for (let i = 0; i < count; ++i) leaderboard.items.push(reader.getFloat32());
                drawLeaderboard();
                break;
            case 0x40: // Set the borders
                border.left = reader.getFloat64();
                border.top = reader.getFloat64();
                border.right = reader.getFloat64();
                border.bottom = reader.getFloat64();
                border.width = border.right - border.left;
                border.height = border.bottom - border.top;
                border.centerX = (border.left + border.right) / 2;
                border.centerY = (border.top + border.bottom) / 2;
                if (data.data.byteLength === 33) break;
                if (!mapCenterSet) {
                    mapCenterSet = 1;
                    camera.x = target.x = border.centerX;
                    camera.y = target.y = border.centerY;
                    camera.z = target.z = 1;
                }
                reader.getUint32(); // game type
                if (!/MultiOgar/.test(reader.getStringUTF8()) || stats.pingLoopId) break;
                stats.pingLoopId = setInterval(() => {
                    wsSend(UINT8[254]);
                    stats.pingLoopStamp = Date.now();
                }, 2000);
                break;
            case 0x63: // chat message
                flags = reader.getUint8();
                color = bytesToColor(reader.getUint8(), reader.getUint8(), reader.getUint8());
                name = reader.getStringUTF8().trim();
                let reg = /\{([\w]+)\}/.exec(name);
                if (reg) name = name.replace(reg[0], "").trim();
                const parsedChatName = extractHatFromName(name);
                name = parsedChatName.name;
                let message = reader.getStringUTF8(),
                    server = !!(flags & 0x80),
                    admin = !!(flags & 0x40),
                    mod = !!(flags & 0x20);
                if (server && name !== "SERVER") name = "[SERVER] " + name;
                if (admin) name = "[ADMIN] " + name;
                if (mod) name = "[MOD] " + name;
                let wait = Math.max(3000, 1000 + message.length * 150);
                chat.waitUntil = syncUpdStamp - chat.waitUntil > 1000 ? syncUpdStamp + wait : chat.waitUntil + wait;
                const entryColor = parsedChatName.nameColor ? ("#" + parsedChatName.nameColor) : "#FFF";
                const entry = {
                    server: server,
                    admin: admin,
                    mod: mod,
                    color: entryColor,
                    name: name,
                    message: message,
                    time: syncUpdStamp
                };
                chat.messages.push(entry);
                appendDomChatMessage({name: name, message: message, color: entryColor, system: server});
                // best-effort OP-mode detection from server announcements
                try {
                    if (server && /op mode/i.test(message)) {
                        opModeDetected = !(/no longer|disabled|removed/i.test(message));
                    }
                } catch (e) {}
                drawChat();
                break;
            case 0xFE: // server stat
                stats.info = JSON.parse(reader.getStringUTF8());
                stats.latency = syncUpdStamp - stats.pingLoopStamp;
                drawStats();
                break;
            case 0x50: // Players list for minimap (custom)
                try {
                    let count = reader.getUint16();
                    window.__minimapPlayers = [];
                    const seen = new Set();
                    window.__myPlayerId = window.__myPlayerId || null;
                    for (let i = 0; i < count; i++) {
                        let id = reader.getUint32();
                        let x = reader.getFloat32();
                        let y = reader.getFloat32();
                        let isSelf = !!reader.getUint8();
                        let r = reader.getUint8(), g = reader.getUint8(), b = reader.getUint8();
                        let name = reader.getStringUTF8();
                        let colorHex = bytesToColor(r, g, b);
                        window.__minimapPlayers.push({id: id, x: x, y: y, name: name, isSelf: isSelf, color: colorHex});
                        if (isSelf) window.__myPlayerId = id;
                        seen.add(id);
                        if (!minimapSmooth.has(id)) {
                            minimapSmooth.set(id, {x: x, y: y, tx: x, ty: y});
                        } else {
                            const sm = minimapSmooth.get(id);
                            sm.tx = x;
                            sm.ty = y;
                        }
                    }
                    // drop stale entries
                    minimapSmooth.forEach((v, k) => { if (!seen.has(k)) minimapSmooth.delete(k); });
                } catch (e) { window.__minimapPlayers = window.__minimapPlayers || []; }
                break;
            default: // invalid packet
                wsCleanup();
                break;
        }
    }
    function sendMouseMove(x, y) {
        let writer = new Writer(1);
        writer.setUint8(0x10);
        writer.setUint32(x);
        writer.setUint32(y);
        writer._b.push(0, 0, 0, 0);
        wsSend(writer);
    }
    function sendPlay(name) {
        let writer = new Writer(1);
        writer.setUint8(0x00);
        writer.setStringUTF8(name);
        wsSend(writer);
    }
    function sendChat(text) {
        let writer = new Writer();
        writer.setUint8(0x63);
        writer.setUint8(0);
        writer.setStringUTF8(text);
        wsSend(writer);
    }
    // Add a local-only chat line without sending to the server.
    function pushLocalMessage(text, color = "#888", name = "[CLIENT]") {
        if (!chat.messages) chat.messages = [];
        const waitBase = typeof chat.waitUntil === "number" ? chat.waitUntil : 0;
        const lifetime = Math.max(3000, 1000 + (text ? text.length : 0) * 120);
        chat.waitUntil = syncUpdStamp - waitBase > 1000 ? syncUpdStamp + lifetime : waitBase + lifetime;
        chat.messages.push({
            server: false,
            admin: false,
            mod: false,
            color: color,
            name: name,
            message: text,
            time: syncUpdStamp
        });
        appendDomChatMessage({name: name, message: text, color: color, system: true});
        drawChat();
    }
    function isOpClient() {
        return !!opModeDetected;
    }
    function setOpDetected(state) {
        opModeDetected = !!state;
    }
    // Read cached player id from the latest minimap packet.
    function getSelfPlayerId() {
        if (window.__myPlayerId != null) return window.__myPlayerId;
        if (window.__minimapPlayers && window.__minimapPlayers.length) {
            for (let i = 0; i < window.__minimapPlayers.length; i++) {
                let p = window.__minimapPlayers[i];
                if (p && p.isSelf && p.id != null) {
                    window.__myPlayerId = p.id;
                    return p.id;
                }
            }
        }
        return null;
    }
    function gameReset() {
        cleanupObject(cells);
        cleanupObject(border);
        cleanupObject(leaderboard);
        cleanupObject(chat);
        cleanupObject(stats);
        chat.messages = [];
        window.__minimapPlayers = [];
        window.__myPlayerId = null;
        setOpDetected(false);
        idLookupSelecting = false;
        leaderboard.items = [];
        cells.mine = [];
        cells.byId = new Map();
        cells.list = [];
        camera.x = camera.y = target.x = target.y = 0;
        camera.z = target.z = 1;
        mapCenterSet = 0;
        cameraTargetBuffer.length = 0;
        cameraTargetBuffer.push({t: Date.now(), x: camera.x, y: camera.y, z: camera.z});
        lastCameraFrame = Date.now();
        autoRespawnArmed = false;
        hasSpawnedOnce = false;
        if (autoRespawnTimeout) {
            clearTimeout(autoRespawnTimeout);
            autoRespawnTimeout = null;
        }
    }
    if (null !== wHandle.localStorage) wjQuery(window).load(function() {
        wjQuery(".save").each(function() {
            let id = wjQuery(this).data("box-id"),
                value = wHandle.localStorage.getItem("checkbox-" + id);
            if (id > 0 && value != null) {
                let checked = value === "true";
                wjQuery(this).prop("checked", checked);
                wjQuery(this).trigger("change");
            } else if (id < 1 && value != null) {
                wjQuery(this).val(value);
            }
        });
        wjQuery(".save").change(function() {
            let id = wjQuery(this).data("box-id"),
                value = id < 1 ? wjQuery(this).val() : wjQuery(this).prop("checked");
            wHandle.localStorage.setItem("checkbox-" + id, value);
        });
    });
    function hideOverlay() {
        overlayShown = 0;
        autoRespawnArmed = false;
        if (autoRespawnTimeout) {
            clearTimeout(autoRespawnTimeout);
            autoRespawnTimeout = null;
        }
        wjQuery("#overlays").fadeOut(200);
    }
    function queueAutoRespawn() {
        if (!settings.autoRespawn || !autoRespawnArmed || !hasSpawnedOnce) return;
        if (autoRespawnTimeout) return;
        autoRespawnTimeout = setTimeout(() => {
            autoRespawnTimeout = null;
            autoRespawnArmed = false;
            try { window.__suppressOverlayUntil = Date.now() + 1500; } catch (e) {}
            try {
                if (typeof wHandle.playWithSkin === "function") { wHandle.playWithSkin(); return; }
                if (typeof wHandle.play === "function") wHandle.play(buildNamePayload());
            } catch (e) {}
        }, 220);
    }
    function showOverlay() {
        // Respect temporary suppression (e.g., during respawn)
        try {
            if (window.__suppressOverlayUntil && Date.now() < window.__suppressOverlayUntil) return;
        } catch (e) {}
        overlayShown = 1;
        wjQuery("#overlays").fadeIn(300);
        queueAutoRespawn();
    }
    function toCamera(ctx) {
        ctx.translate(mainCanvas.width / 2, mainCanvas.height / 2);
        scaleForth(ctx);
        ctx.translate(-camera.x, -camera.y);
    }
    function scaleForth(ctx) {
        ctx.scale(camera.z, camera.z);
    }
    function scaleBack(ctx) {
        ctx.scale(camera.zScale, camera.zScale);
    }
    function fromCamera(ctx) {
        ctx.translate(camera.x, camera.y);
        scaleBack(ctx);
        ctx.translate(-mainCanvas.width / 2, -mainCanvas.height / 2);
    }
    function drawChat() {
        // Use DOM chatbox now; skip canvas rendering
        return;
        let canvas = chat.canvas,
            ctx = canvas.getContext("2d"),
            latestMessages = chat.messages.slice(-15),
            lines = [],
            len = latestMessages.length;
        for (let i = 0; i < len; i++) lines.push([
            {text: latestMessages[i].name,
            color: latestMessages[i].color},
            {text: " " + latestMessages[i].message,
            color: settings.darkTheme ? "#FFF" : "#000"}
        ]);
        let width = 0,
            height = 20 * len + 2;
        for (let i = 0; i < len; i++) {
            let thisLineWidth = 0,
                complexes = lines[i];
            for (let j = 0; j < complexes.length; j++) {
                ctx.font = "18px Arial";
                complexes[j].width = ctx.measureText(complexes[j].text).width;
                thisLineWidth += complexes[j].width;
            }
            width = Math.max(thisLineWidth, width);
        }
        canvas.width = width;
        canvas.height = height;
        for (let i = 0; i < len; i++) {
            width = 0;
            let complexes = lines[i];
            for (let j = 0; j < complexes.length; j++) {
                ctx.font = "18px Arial";
                ctx.fillStyle = complexes[j].color;
                ctx.fillText(complexes[j].text, width, 20 * (1 + i));
                width += complexes[j].width;
            }
        }
    }
    function drawStats() {
        if (!stats.info || settings.hideStats) return stats.visible = 0;
        stats.visible = 1;
        let canvas = stats.canvas,
            ctx = canvas.getContext("2d");
        const title = "Stats";
        const titleFont = "700 18px Arial";
        const bodyFont = "14px Arial";
        const padX = 10;
        const padY = 8;
        const titleGap = 6;
        const lineHeight = 18;
        ctx.font = bodyFont;
        if (typeof stats.info.botsTotal === "undefined") stats.info.botsTotal = 0;
        if (typeof stats.info.playersDead === "undefined") stats.info.playersDead = 0;
        let rows = [
                `${stats.info.name} (${stats.info.mode})`,
                `${stats.info.playersTotal} / ${stats.info.playersLimit} players`,
                `${stats.info.playersAlive} playing`,
                `${stats.info.playersDead} dead`,
                `${stats.info.playersSpect} spectating`,
                `${stats.info.botsTotal} bots`,
                `${(stats.info.update * 2.5).toFixed(1)}% memory load`,
                `${prettyPrintTime(stats.info.uptime)} uptime`
            ],
            width = 0;
        // Measure widths (use body font)
        for (let i = 0; i < rows.length; i++) width = Math.max(width, ctx.measureText(rows[i]).width);
        ctx.font = titleFont;
        width = Math.max(width, ctx.measureText(title).width);
        canvas.width = padX * 2 + width;
        canvas.height = padY * 2 + (lineHeight * rows.length) + titleGap + 18;
        // Background card
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(10,10,12,0.78)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
        // Title
        ctx.font = titleFont;
        ctx.fillStyle = "#eaeaea";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.fillText(title, padX, padY);
        // Rows
        ctx.font = bodyFont;
        ctx.fillStyle = settings.darkTheme ? "#BBB" : "#444";
        for (let i = 0; i < rows.length; i++) {
            ctx.fillText(rows[i], padX, padY + 22 + i * lineHeight);
        }
    }
    function prettyPrintNumber(num) {
        if (isNaN(num)) return "0";
        if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
        if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
        return `${num}`;
    }
    function prettyPrintTime(seconds) {
        seconds = ~~seconds;
        let minutes = ~~(seconds / 60);
        if (minutes < 1) return "<1 min";
        let hours = ~~(minutes / 60);
        if (hours < 1) return minutes + " min";
        let days = ~~(hours / 24);
        if (days < 1) return hours + " hours";
        return days + " days";
    }
    function drawHudCard() {
        const fps = Math.max(0, Math.round(stats.framesPerSecond));
        const targetFps = Math.min(fps, 240);
        hudFpsSmooth = hudFpsSmooth || targetFps;
        hudFpsSmooth += (targetFps - hudFpsSmooth) * 0.08;
        const smoothFps = Math.round(hudFpsSmooth);
        const ping = isNaN(stats.latency) ? "--" : `${stats.latency}ms`;
        const scoreVal = isNaN(stats.score) ? 0 : Math.round(stats.score);
        const massVal = scoreVal;
        const cellsCount = Array.isArray(cells.mine) ? cells.mine.length : 0;
        const lines = [
            `FPS: ${smoothFps}`,
            `Ping: ${ping}`,
            `Mass: ${prettyPrintNumber(massVal)}`,
            `Score: ${prettyPrintNumber(scoreVal)}`,
            `Cells: ${cellsCount}`
        ];
        // Adjust padding/spacing to avoid touching borders and reduce bottom gap
        const bodyFont = "15px Arial";
        const padX = 16;
        const padTop = 14;
        const padBottom = 0;
        const lineHeight = 15;
        let width = 0;
        mainCtx.save();
        mainCtx.font = bodyFont;
        for (let i = 0; i < lines.length; i++) {
            width = Math.max(width, mainCtx.measureText(lines[i]).width);
        }
        const cardWidth = Math.max(190, padX * 2 + width);
        const cardHeight = padTop + padBottom + lines.length * lineHeight;
        const x = 10, y = 14;
        // background
        mainCtx.fillStyle = "rgba(10,10,12,0.82)";
        mainCtx.fillRect(x, y, cardWidth, cardHeight);
        // inner highlight
        mainCtx.strokeStyle = "rgba(255,255,255,0.05)";
        mainCtx.lineWidth = 1;
        mainCtx.strokeRect(x + 1.5, y + 1.5, cardWidth - 3, cardHeight - 3);
        mainCtx.strokeStyle = "rgba(255,255,255,0.12)";
        mainCtx.strokeRect(x + 0.5, y + 0.5, cardWidth - 1, cardHeight - 1);
        // body
        mainCtx.font = bodyFont;
        for (let i = 0; i < lines.length; i++) {
            mainCtx.fillStyle = "#e0e0e0";
            // highlight ping in green if known
            if (lines[i].startsWith("Ping") && !isNaN(stats.latency)) mainCtx.fillStyle = "#5ce35c";
            mainCtx.fillText(lines[i], x + padX, y + padTop + i * lineHeight);
        }
        mainCtx.restore();
    }
    function drawLeaderboard() {
        if (leaderboard.type === NaN) return leaderboard.visible = 0;
        if (!settings.showNames || !leaderboard.items || !leaderboard.items.length) return leaderboard.visible = 0;
        leaderboard.visible = 1;
        let canvas = leaderboard.canvas,
            ctx = canvas.getContext("2d"),
            len = leaderboard.items.length;
        canvas.width = 260;
        canvas.height = leaderboard.type !== "pie" ? 70 + 26 * len : 240;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        // glassy background
        ctx.fillStyle = "rgba(10,10,12,0.78)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
        ctx.fillStyle = "#eaeaea";
        ctx.font = "700 22px Arial";
        ctx.fillText("Leaderboard", canvas.width / 2 - ctx.measureText("Leaderboard").width / 2, 34);
        if (leaderboard.type === "pie") {
            let last = 0;
            for (let i = 0; i < len; i++) {
                ctx.fillStyle = leaderboard.teams[i];
                ctx.beginPath();
                ctx.moveTo(125, 140);
                ctx.arc(125, 140, 80, last, (last += leaderboard.items[i] * PI_2), 0);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            let text,
                isMe = 0;
            ctx.font = "16px Arial";
            for (let i = 0; i < len; i++) {
                if (leaderboard.type === "text") text = leaderboard.items[i];
                else {
                    text = leaderboard.items[i].name;
                    isMe = leaderboard.items[i].me;
                }
                let reg = /\{([\w]+)\}/.exec(text);
                if (reg) text = text.replace(reg[0], "").trim();
                const parsedColor = leaderboard.items[i] && leaderboard.items[i].color ? leaderboard.items[i].color : null;
                const selfHex = typeof resolveNameColor === "function" ? resolveNameColor() : ("#" + (String($("#nameColor").val() || "FFF")));
                const nameHex = parsedColor || (isMe ? selfHex : "#e0e0e0");
                ctx.fillStyle = nameHex;
                if (leaderboard.type === "ffa") text = (i + 1) + ". " + (text || "An unnamed cell");
                ctx.textAlign = "left";
                ctx.fillText(text, 14, 62 + 26 * i);
            }
        }
    }
    function drawGrid() {
        mainCtx.save();
        mainCtx.lineWidth = 1;
        mainCtx.strokeStyle = settings.darkTheme ? "#AAA" : "#000";
        mainCtx.globalAlpha = .2;
        let step = 50,
            i,
            cW = mainCanvas.width / camera.z,
            cH = mainCanvas.height / camera.z,
            startLeft = (-camera.x + cW / 2) % step,
            startTop = (-camera.y + cH / 2) % step;
        scaleForth(mainCtx);
        mainCtx.beginPath();
        for (i = startLeft; i < cW; i += step) {
            mainCtx.moveTo(i, 0);
            mainCtx.lineTo(i, cH);
        }
        for (i = startTop; i < cH; i += step) {
            mainCtx.moveTo(0, i);
            mainCtx.lineTo(cW, i);
        }
        mainCtx.closePath();
        mainCtx.stroke();
        mainCtx.restore();
    }
    function drawBorders() { // Rendered unusable when a server has coordinate scrambling enabled
        if (!isConnected || !settings.mapBorders) return;
        mainCtx.save();
        mainCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
        mainCtx.lineWidth = 100;
        mainCtx.lineCap = "round";
        mainCtx.lineJoin = "round";
        mainCtx.beginPath();
        mainCtx.moveTo(border.left, border.top);
        mainCtx.lineTo(border.right, border.top);
        mainCtx.lineTo(border.right, border.bottom);
        mainCtx.lineTo(border.left, border.bottom);
        mainCtx.closePath();
        mainCtx.stroke();
        mainCtx.restore();
    }
    function drawSectors() { // Rendered unusable when a server has coordinate scrambling enabled
        if (!isConnected || !settings.sectors) return;
        // Properly align sectors to border
        const SECT_COLS = 5, SECT_ROWS = 5;
        const letter = "ABCDE";
        let w = (border.right - border.left) / SECT_COLS;
        let h = (border.bottom - border.top) / SECT_ROWS;
        mainCtx.save();
        mainCtx.textAlign = "center";
        mainCtx.textBaseline = "middle";
        mainCtx.font = Math.floor(w * 0.5) + "px Ubuntu, Arial, sans-serif";
        mainCtx.fillStyle = "rgba(255,255,255,0.6)";
        for (let c = 0; c < SECT_COLS; c++) {
            for (let r = 0; r < SECT_ROWS; r++) {
                let sx = border.left + c * w;
                let sy = border.top + r * h;
                // Draw sector label
                mainCtx.fillText(letter[c] + (r + 1), sx + w / 2, sy + h / 2);
                // Draw sector border
                mainCtx.strokeStyle = "rgba(255,255,255,0.15)";
                mainCtx.lineWidth = 2;
                mainCtx.strokeRect(sx, sy, w, h);
            }
        }
        mainCtx.restore();
    }
    function drawMinimap() { // Rendered unusable when a server has coordinate scrambling enabled
        if (!isConnected || !settings.showMinimap) return;
        mainCtx.save();
        let width = 200 * (border.width / border.height),
            height = 200 * (border.height / border.width),
            beginX = mainCanvas.width / camera.viewMult - width,
            beginY = mainCanvas.height / camera.viewMult - height;
        mainCtx.fillStyle = "#000";
        mainCtx.globalAlpha = .45;
        mainCtx.fillRect(beginX, beginY, width, height);
        mainCtx.globalAlpha = 1;
        // Draw sectors backdrop - 5x5 nicer labels in Arial
        mainCtx.save();
        mainCtx.strokeStyle = settings.darkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
        mainCtx.lineWidth = 1;
        const SECT_COLS = 5, SECT_ROWS = 5;
        let sectW = width / SECT_COLS, sectH = height / SECT_ROWS;
        mainCtx.font = "12px Arial";
        mainCtx.fillStyle = settings.darkTheme ? "#BBB" : "#333";
        mainCtx.textAlign = "center";
        mainCtx.textBaseline = "middle";
        const letters = "ABCDE";
        for (let r = 0; r < SECT_ROWS; r++) {
            for (let c = 0; c < SECT_COLS; c++) {
                let sx = beginX + c * sectW, sy = beginY + r * sectH;
                mainCtx.strokeRect(sx, sy, sectW, sectH);
                // label centered inside cell: Letter+Number
                let label = letters[c] + (r + 1);
                mainCtx.fillText(label, sx + sectW / 2, sy + sectH / 2);
            }
        }
        mainCtx.restore();
        let scaleX = width / border.width,
            scaleY = height / border.height,
            halfWidth = border.width / 2,
            halfHeight = border.height / 2;

        // Prepare own cells list early for labeling/highlight
        let myCells = [];
        for (let i = 0; i < cells.mine.length; i++) if (cells.byId.has(cells.mine[i])) myCells.push(cells.byId.get(cells.mine[i]));

        // Use server-provided minimap players if available (shows all players regardless of view).
        // Smooth positions
        minimapSmooth.forEach((val) => {
            val.x += (val.tx - val.x) * 0.22;
            val.y += (val.ty - val.y) * 0.22;
        });
        let minimapList = null;
        if (minimapSmooth.size) {
            const latestRaw = window.__minimapPlayers || [];
            minimapList = Array.from(minimapSmooth, ([id, v]) => {
                const raw = latestRaw.find(p => p.id === id) || {};
                const parsed = extractHatFromName(raw.name || "");
                const cleanName = parsed.name;
                const colorHex = parsed.nameColor ? ("#" + parsed.nameColor) : raw.color;
                return {id: id, x: v.x, y: v.y, name: cleanName, isSelf: raw.isSelf, color: colorHex};
            });
        } else if (window.__minimapPlayers && window.__minimapPlayers.length) {
            minimapList = window.__minimapPlayers.map(p => {
                const parsed = extractHatFromName(p.name || "");
                return {
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    name: parsed.name,
                    isSelf: p.isSelf,
                    color: parsed.nameColor ? ("#" + parsed.nameColor) : p.color
                };
            });
        }
        mainCtx.save();
        const INDICATOR = Math.max(2, Math.round(3 * camera.viewMult));
        if (minimapList) {
            // resolve self color once per frame; guard DOM access
            let selfColor = "#FFF";
            try { selfColor = resolveNameColor(); } catch (e) {}
            for (let i = 0; i < minimapList.length; i++) {
                let p = minimapList[i];
                let mx = beginX + (p.x - border.left) * scaleX;
                let my = beginY + (p.y - border.top) * scaleY;
                if (mx < beginX - 2 || mx > beginX + width + 2 || my < beginY - 2 || my > beginY + height + 2) continue;
                const fill = p.isSelf ? selfColor : (p.color || "#FFF");
                // draw indicator
                mainCtx.beginPath();
                mainCtx.fillStyle = fill;
                mainCtx.arc(mx, my, INDICATOR, 0, PI_2);
                mainCtx.fill();
                // draw name label above indicator
                if (p.name) {
                    const safeName = String(p.name || "").slice(0, 32);
                    mainCtx.fillStyle = fill;
                    mainCtx.font = "11px Arial";
                    mainCtx.textAlign = "center";
                    mainCtx.textBaseline = "bottom";
                    mainCtx.fillText(safeName, mx, my - INDICATOR - 2);
                }
            }
        } else {
            // Fallback behavior: aggregate visible cells into player centers (older servers)
            let players = new Map();
            for (let i = 0; i < cells.list.length; i++) {
                let c = cells.list[i];
                if (!c || c.destroyed) continue;
                if (c.food || c.ejected) continue;
                let key;
                if (c.name && String(c.name).trim()) key = "name:" + c.name;
                else key = "anon:" + (Math.floor(c.x / 500) + "," + Math.floor(c.y / 500));
                if (!players.has(key)) players.set(key, {sumx: 0, sumy: 0, count: 0, name: (c.name || null), isMe: false});
                let p = players.get(key);
                p.sumx += c.x;
                p.sumy += c.y;
                p.count += 1;
                if (cells.mine.indexOf(c.id) !== -1) p.isMe = true;
                if (!p.name && c.name) p.name = c.name;
            }
            // resolve self color once per frame; guard DOM access
            let selfColor = "#FFF";
            try { selfColor = resolveNameColor(); } catch (e) {}
            for (let [k, p] of players) {
                let cx = p.sumx / p.count,
                    cy = p.sumy / p.count;
                let mx = beginX + (cx + halfWidth) * scaleX,
                    my = beginY + (cy + halfHeight) * scaleY;
                if (mx < beginX - 2 || mx > beginX + width + 2 || my < beginY - 2 || my > beginY + height + 2) continue;
                const fill = p.isMe ? selfColor : "#FFF";
                mainCtx.beginPath();
                mainCtx.fillStyle = fill;
                mainCtx.arc(mx, my, INDICATOR, 0, PI_2);
                mainCtx.fill();
                if (p.name) {
                    const safeName = String(p.name || "").slice(0, 32);
                    mainCtx.font = "11px Arial";
                    mainCtx.textAlign = "center";
                    mainCtx.textBaseline = "bottom";
                    mainCtx.fillStyle = fill;
                    mainCtx.fillText(safeName, mx, my - INDICATOR - 2);
                }
            }
        }
        mainCtx.restore();

        // Removed camera center indicator for a cleaner minimap
        mainCtx.restore();
    }
    function drawGame() {
        stats.framesPerSecond += (1000 / Math.max(Date.now() - syncAppStamp, 1) - stats.framesPerSecond) / 10;
        syncAppStamp = Date.now();
        let drawList = cells.list.slice(0).sort(cellSort);
        for (let i = 0; i < drawList.length; i++) drawList[i].update(syncAppStamp);
        cameraUpdate();
        if (settings.jellyPhysics)
            for (let i = 0; i < drawList.length; i++) {
                let cell = drawList[i];
                if (cell.updateRender) cell.updateRender();
                cell.updateNumPoints();
                cell.movePoints();
            }
        mainCtx.save();
        mainCtx.fillStyle = settings.darkTheme ? "#111" : "#F2FBFF";
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        if (!settings.hideGrid) drawGrid();
        toCamera(mainCtx);
        drawBorders();
        drawSectors();
        for (let i = 0; i < drawList.length; i++) drawList[i].draw(mainCtx);
        fromCamera(mainCtx);
        mainCtx.scale(camera.viewMult, camera.viewMult);
        drawHudCard();
        if (stats.visible) mainCtx.drawImage(stats.canvas, 2, 150);
        if (leaderboard.visible) mainCtx.drawImage(leaderboard.canvas, mainCanvas.width / camera.viewMult - 12 - leaderboard.canvas.width, 10);
        if (!settings.hideChat && (isTyping || 1)) {
            mainCtx.globalAlpha = isTyping ? 1 : Math.max(1000 - syncAppStamp + chat.waitUntil, 0) / 1000;
            mainCtx.drawImage(chat.canvas, 10 / camera.viewMult, (mainCanvas.height - 55) / camera.viewMult - chat.canvas.height);
            mainCtx.globalAlpha = 1;
        }
        drawMinimap();
        mainCtx.restore();
        cacheCleanup();
        wHandle.requestAnimationFrame(drawGame);
    }
    function cellSort(a, b) {
        return a.s === b.s ? a.id - b.id : a.s - b.s;
    }
    function lerpFromPercent(percent, deltaMs) {
        const rate = clampNumber(percent, 0, 400) / 100;
        return 1 - Math.pow(1 - rate, deltaMs / 16.7);
    }
    function animationScale() {
        const delay = clampNumber(settings.drawDelayMs || 0, 0, 400);
        // 0ms = 1x speed, 400ms ≈ 0.3x speed
        return 1 / (1 + delay / 140);
    }
    function pushCameraTargetState(now, tx, ty, tz) {
        cameraTargetBuffer.push({t: now, x: tx, y: ty, z: tz});
        while (cameraTargetBuffer.length > 60 || (cameraTargetBuffer.length && cameraTargetBuffer[0].t < now - 2000)) cameraTargetBuffer.shift();
    }
    function sampleCameraTarget(now, delayMs) {
        if (!cameraTargetBuffer.length || delayMs <= 0) return cameraTargetBuffer[cameraTargetBuffer.length - 1] || target;
        const cutoff = now - delayMs;
        let prev = cameraTargetBuffer[0];
        for (let i = 1; i < cameraTargetBuffer.length; i++) {
            const cur = cameraTargetBuffer[i];
            if (cur.t >= cutoff) {
                const span = Math.max(1, cur.t - prev.t);
                const f = clampNumber((cutoff - prev.t) / span, 0, 1);
                return {
                    x: prev.x + (cur.x - prev.x) * f,
                    y: prev.y + (cur.y - prev.y) * f,
                    z: prev.z + (cur.z - prev.z) * f
                };
            }
            prev = cur;
        }
        return cameraTargetBuffer[cameraTargetBuffer.length - 1] || target;
    }
    function cameraUpdate() {
        const now = Date.now();
        const frameDelta = Math.max(1, now - lastCameraFrame);
        lastCameraFrame = now;

        let myCells = [];
        for (let i = 0; i < cells.mine.length; i++) {
            let cell = cells.byId.get(cells.mine[i]);
            if (cell) myCells.push(cell);
        }
        let nextTarget = { x: target.x, y: target.y, z: target.z };
        if (myCells.length > 0) {
            let x = 0,
                y = 0,
                s = 0,
                score = 0,
                len = myCells.length;
            for (let i = 0; i < len; i++) {
                let cell = myCells[i];
                score += ~~(cell.ns * cell.ns / 100);
                x += cell.x;
                y += cell.y;
                s += cell.s;
            }
            nextTarget.x = x / len;
            nextTarget.y = y / len;
            nextTarget.z = Math.pow(Math.min(24 / s, 1), .4);
            stats.score = score;
            stats.maxScore = Math.max(stats.maxScore, score);
        } else {
            stats.score = NaN;
            stats.maxScore = 0;
        }
        target.x = nextTarget.x || 0;
        target.y = nextTarget.y || 0;
        target.z = nextTarget.z || 1;

        pushCameraTargetState(now, target.x, target.y, target.z);
        // Animation delay taps into render/game smoothing instead of only camera.
        const lagMs = clampNumber(settings.drawDelayMs || 0, 0, 400);
        const laggedTarget = sampleCameraTarget(now, lagMs);

        if (settings.autoZoom) {
            const autoZoomAlpha = lerpFromPercent(Math.max(settings.cameraZoomSpeed * 0.75, 8), frameDelta);
            mouse.z += (1 - mouse.z) * autoZoomAlpha;
        }

        const animScale = animationScale();
        const panAlpha = lerpFromPercent(settings.cameraPanSpeed * animScale, frameDelta);
        const zoomAlpha = clampNumber(lerpFromPercent(settings.cameraZoomSpeed * (settings.infiniteZoom ? 1.8 : 1) * animScale, frameDelta), 0.01, 0.5);

        camera.x += (laggedTarget.x - camera.x) * panAlpha;
        camera.y += (laggedTarget.y - camera.y) * panAlpha;
        const zoomTarget = settings.autoZoom
            ? (laggedTarget.z || 1) * camera.viewMult * mouse.z
            : camera.viewMult * mouse.z;
        camera.z += (zoomTarget - camera.z) * zoomAlpha;
        camera.zScale = 1 / camera.z;
    }
    class Cell {
        constructor(id, x, y, s, name, color, skin, flags) {
            this.destroyed = 0;
            this.diedBy = 0;
            this.nameSize = 0;
            this.drawNameSize = 0;
            this.updated = null;
            this.dead = null; // timestamps
            this.id = id;
            this.x = this.nx = this.ox = x;
            this.y = this.ny = this.oy = y;
            this.s = this.ns = this.os = s;
            // Render-smoothing state (used to avoid framey jumps on rapid splits/teleports)
            this.rx = x;
            this.ry = y;
            this.rs = s;
            this.lastFrame = Date.now();
            this.hatCode = null;
            this.nameColor = null;
            this.setColor(color);
            this.setName(name);
            this.setSkin(skin);
            this.jagged = flags & 0x01 || flags & 0x10;
            this.ejected = !!(flags & 0x20);
            this.food = !!(flags & 0x80); // For my server
            this.born = syncUpdStamp;
            this.points = [];
            this.pointsVel = [];
        }
        destroy(killerId) {
            cells.byId.delete(this.id);
            if (cells.mine.remove(this.id) && !cells.mine.length) {
                autoRespawnArmed = true;
                showOverlay();
            }
            this.destroyed = 1;
            this.dead = syncUpdStamp;
            if (killerId && !this.diedBy) this.diedBy = killerId;
        }
        update(relativeTime) {
            const now = Date.now();
            let diedBy;
            if (this.destroyed && now > this.dead + 200) {
                cells.list.remove(this);
                return;
            } else if (this.diedBy && (diedBy = cells.byId.get(this.diedBy))) {
                this.nx = diedBy.x;
                this.ny = diedBy.y;
            }

            // Frame-time–based smoothing toward latest server state
            const prevFrameSize = this.rs;
            const frameMs = Math.max(1, now - this.lastFrame);
            this.lastFrame = now;
            // Convert frame time to a smoothing alpha (target ~0.32 per 60 FPS frame)
            const animScaleFactor = animationScale();
            const alpha = 1 - Math.pow(1 - 0.15 * animScaleFactor, frameMs / 16.7);

            // If a giant jump happened (teleport/spawn), snap
            const maxSnapDist = (this.rs + this.ns) * 4 + 150;
            const dxJump = this.nx - this.rx;
            const dyJump = this.ny - this.ry;
            if (dxJump * dxJump + dyJump * dyJump > maxSnapDist * maxSnapDist) {
                this.rx = this.nx;
                this.ry = this.ny;
                this.rs = this.ns;
            } else {
                this.rx += (this.nx - this.rx) * alpha;
                this.ry += (this.ny - this.ry) * alpha;
                this.rs += (this.ns - this.rs) * alpha;
            }

            // Legacy fields kept in sync for other logic
            this.x = this.rx;
            this.y = this.ry;
            this.s = this.rs;

            this.nameSize = ~~(~~(Math.max(~~(.3 * this.ns), 24)) / 3) * 3;
            this.drawNameSize = ~~(~~(Math.max(~~(.3 * this.s), 24)) / 3) * 3;
            if (settings.jellyPhysics && this.points.length) {
                let ratio = this.s / prevFrameSize;
                if (this.ns != this.os && ratio != 1)
                    for (let i = 0; i < this.points.length; i++) this.points[i].rl *= ratio;
            }
        }
        updateNumPoints() {
            let numPoints = Math.min(Math.max(this.s * camera.z | 0, CELL_POINTS_MIN), CELL_POINTS_MAX);
            if (this.jagged) numPoints = Math.floor(this.s);
            while (this.points.length > numPoints) {
                let i = Math.random() * this.points.length | 0;
                this.points.splice(i, 1);
                this.pointsVel.splice(i, 1);
            }
            if (this.points.length === 0 && numPoints !== 0) {
                this.points.push({
                    x: this.x,
                    y: this.y,
                    rl: this.s,
                    parent: this,
                });
                this.pointsVel.push(Math.random() - .5);
            }
            while (this.points.length < numPoints) {
                let i = Math.random() * this.points.length | 0,
                    point = this.points[i],
                    vel = this.pointsVel[i];
                this.points.splice(i, 0, {
                    x: point.x,
                    y: point.y,
                    rl: point.rl,
                    parent: this
                });
                this.pointsVel.splice(i, 0, vel);
            }
        }
        movePoints() {
            let pointsVel = this.pointsVel.slice();
            for (let i = 0; i < this.points.length; ++i) {
                let prevVel = pointsVel[(i - 1 + this.points.length) % this.points.length],
                    nextVel = pointsVel[(i + 1) % this.points.length],
                    newVel = Math.max(Math.min((this.pointsVel[i] + Math.random() - .5) * .7, 10), -10);
                this.pointsVel[i] = (prevVel + nextVel + 8 * newVel) / 10;
            }
            for (let i = 0; i < this.points.length; ++i) {
                let curP = this.points[i],
                    prevRl = this.points[(i - 1 + this.points.length) % this.points.length].rl,
                    nextRl = this.points[(i + 1) % this.points.length].rl,
                    curRl = curP.rl,
                    affected = false;
                if (!affected && (curP.x < border.left || curP.y < border.top || curP.x > border.right || curP.y > border.bottom)) affected = true;
                if (affected) this.pointsVel[i] = Math.min(this.pointsVel[i], 0) - 1;
                curRl += this.pointsVel[i];
                curRl = Math.max(curRl, 0);
                curRl = (9 * curRl + this.s) / 10;
                curP.rl = (prevRl + nextRl + 8 * curRl) / 10;
                let angle = 2 * Math.PI * i / this.points.length,
                    rl = curP.rl;
                if (this.jagged && i % 2 === 0) rl += 5;
                curP.x = this.x + Math.cos(angle) * rl;
                curP.y = this.y + Math.sin(angle) * rl;
            }
        }
        setName(value) {
            const parsed = extractHatFromName(value || "");
            let nameSkin = /\{([\w\W]+)\}/.exec(parsed.name);
            if (this.skin == null && nameSkin != null) {
                this.name = parsed.name.replace(nameSkin[0], "").trim();
                this.setSkin(nameSkin[1]);
            } else this.name = parsed.name;
            this.nameColor = parsed.nameColor ? ("#" + parsed.nameColor) : null;
            this.hatCode = parsed.hatCode;
        }
        setSkin(value) {
            this.skin = (value && value[0] === "%" ? value.slice(1) : value) || this.skin;
            if (this.skin == null || loadedSkins[this.skin]) return;
            loadedSkins[this.skin] = new Image();
            // If skin looks like a URL or data URI, use it directly. Support protocol-relative URLs.
            let src = null;
            let s = this.skin;
            if (/^data:/i.test(s) || /:\/\//.test(s) || /^\/\//.test(s)) {
                // protocol-relative or absolute URL (contains ://) or data URI
                if (s.indexOf('//') === 0 && USE_HTTPS) src = 'https:' + s;
                else src = s;
            } else if (s.indexOf('/') !== -1) {
                // contains a path - treat as relative/absolute path; append .png if no extension
                src = s;
                if (!/\.(png|jpg|jpeg|gif)$/i.test(src)) src = `${src}.png`;
            } else {
                // default behavior: look in SKIN_URL and append .png
                src = `${SKIN_URL}${s}.png`;
            }
            loadedSkins[this.skin].src = src;
        }
        setColor(value) {
            if (!value) return log.warn("Returned no color!");
            this.color = value;
            this.sColor = darkenColor(value);
        }
        draw(ctx) {
            ctx.save();
            this.drawShape(ctx);
            this.drawHat(ctx);
            this.drawText(ctx);
            ctx.restore();
        }
        drawShape(ctx) {
            if (settings.hideFood && this.food) return;
            const isMine = cells.mine.indexOf(this.id) !== -1;
            ctx.fillStyle = settings.showColor ? this.color : Cell.prototype.color;
            let color = String($("#cellBorderColor").val());
            ctx.strokeStyle = color.length === 3 || color.length === 6 ? "#" + color : settings.showColor ? this.sColor : Cell.prototype.sColor;
            ctx.lineWidth = this.jagged ? 12 : Math.max(~~(this.s / 50), 10);
            let showCellBorder = settings.cellBorders && !this.food && !this.ejected && 20 < this.s;
            if (showCellBorder) this.s -= ctx.lineWidth / 2 - 2;
            ctx.beginPath();
            if (this.jagged) ctx.lineJoin = "miter";
            if (settings.jellyPhysics && this.points.length) {
                let point = this.points[0];
                ctx.moveTo(point.x, point.y);
                for (let i = 0; i < this.points.length; i++) ctx.lineTo(this.points[i].x, this.points[i].y);
            } else if (this.jagged) {
                let points = Math.floor(this.s),
                    increment = PI_2 / points;
                ctx.moveTo(this.x, this.y + this.s + 3);
                for (let i = 1; i < points; i++) {
                    let angle = i * increment,
                        dist = this.s - 3 + (i % 2 === 0) * 6;
                    ctx.lineTo(this.x + dist * Math.sin(angle), this.y + dist * Math.cos(angle));
                }
                ctx.lineTo(this.x, this.y + this.s + 3);
            } else ctx.arc(this.x, this.y, this.s, 0, PI_2, false);
            ctx.closePath();
            // Keep fill opacity stable (only reduce when destroyed or transparency is enabled)
            let fadeAlpha = 1;
            if (settings.transparency) fadeAlpha = 0.75;
            else if (this.destroyed) fadeAlpha = Math.max(200 - Date.now() + this.dead, 0) / 100;
            ctx.save();
            ctx.globalAlpha = fadeAlpha;
            if (showCellBorder) ctx.stroke();
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1;
            if (settings.showSkins && this.skin && (isMine || settings.showOtherSkins)) {
                let skin = loadedSkins[this.skin];
                if (skin && skin.complete && skin.width && skin.height) {
                    ctx.save();
                    ctx.clip();
                    scaleBack(ctx);
                    let sScaled = this.s * camera.z;
                    if (settings.jellyPhysics) sScaled += 3;
                    ctx.drawImage(skin, this.x * camera.z - sScaled, this.y * camera.z - sScaled, sScaled *= 2, sScaled);
                    scaleForth(ctx);
                    ctx.restore();
                }
            }
            if (showCellBorder) this.s += ctx.lineWidth / 2 - 2;
        }
        drawHat(ctx) {
            const hatInput = document.getElementById('hatUrl');
            let code = null;
            // Always prefer local input for our own cells (server may strip custom tags)
            if (hatInput && hatInput.value && cells.mine && cells.mine.indexOf(this.id) !== -1) {
                code = buildHatCode(hatInput.value);
            } else {
                code = this.hatCode;
            }
            if (!code) return;
            const img = getHatImageFromCode(code);
            if (!img || !img.complete || !img.width || !img.height) return;
            ctx.save();
            ctx.globalAlpha = HAT_OPACITY;
            const drawSize = this.s * 2;
            ctx.drawImage(img, this.x - this.s, this.y - this.s - this.s * 1.66, drawSize, drawSize);
            ctx.restore();
        }
        drawText(ctx) {
            if (this.s < 20 || this.jagged) return;
            const isMine = cells.mine.indexOf(this.id) !== -1;
            const isSplit = isMine && cells.mine.length > 1;
            if (!isMine && !settings.showOtherNames) return;
            // Dynamically scale hide threshold with current biggest owned cell
            let maxMineSize = 0;
            if (isMine && cells.byId) {
                for (let i = 0; i < cells.mine.length; i++) {
                    const id = cells.mine[i];
                    const c = cells.byId.get ? cells.byId.get(id) : cells.byId[id];
                    if (c && c.s > maxMineSize) maxMineSize = c.s;
                }
            }
            // Track the biggest non-mine cell so every player keeps at least one label
            let maxOtherSize = 0;
            if (!isMine && cells.byId) {
                if (cells.byId.forEach) {
                    cells.byId.forEach((c, id) => {
                        if (cells.mine && cells.mine.indexOf(id) !== -1) return;
                        if (c && c.s > maxOtherSize) maxOtherSize = c.s;
                    });
                } else {
                    for (let id in cells.byId) {
                        if (cells.mine && cells.mine.indexOf(+id) !== -1) continue;
                        const c = cells.byId[id];
                        if (c && c.s > maxOtherSize) maxOtherSize = c.s;
                    }
                }
            }
            const baseThreshold = Math.max(2000, maxMineSize * 0.95); // much higher threshold so tiny splits stay hidden
            // Only let the very largest piece (or comparable) draw text while split
            if (isSplit && maxMineSize && this.s < baseThreshold && this.s < maxMineSize * 0.98) return;
            // Apply similar hide rule to other players: keep their largest (or near-largest) cell visible, hide tiny splits
            if (!isMine && maxOtherSize) {
                const otherThreshold = Math.max(1800, maxOtherSize * 0.6);
                const isLargestOther = this.s >= maxOtherSize * 0.98;
                if (!isLargestOther && this.s < otherThreshold) return;
            }
            if (settings.showMass && (isMine || !cells.mine.length) && !this.food/* && !this.ejected*/) {
                let mass = (~~(this.s * this.s / 100)).toString();
                if (this.name && settings.showNames) {
                    drawText(ctx, 0, this.x, this.y, this.nameSize, this.drawNameSize, this.name, isMine, this.nameColor);
                    let y = this.y + Math.max(this.s / 4.5, this.nameSize / 1.5);
                    drawText(ctx, 1, this.x, y, this.nameSize / 2, this.drawNameSize / 2, mass, isMine, null);
                } else drawText(ctx, 1, this.x, this.y, this.nameSize / 2, this.drawNameSize / 2, mass, isMine, null);
            } else if (this.name && settings.showNames) drawText(ctx, 0, this.x, this.y, this.nameSize, this.drawNameSize, this.name, isMine, this.nameColor);
        }
    }
    // 2-var draw-stay cache
    let cachedNames = {},
        cachedMass  = {};
    function cacheCleanup() {
        for (let colorKey in cachedNames) {
            for (let nameKey in cachedNames[colorKey]) {
                for (let sizeKey in cachedNames[colorKey][nameKey])
                    if (syncAppStamp - cachedNames[colorKey][nameKey][sizeKey].accessTime >= 5000)
                        delete cachedNames[colorKey][nameKey][sizeKey];
                if (Object.keys(cachedNames[colorKey][nameKey]).length === 0) delete cachedNames[colorKey][nameKey];
            }
            if (Object.keys(cachedNames[colorKey]).length === 0) delete cachedNames[colorKey];
        }
        for (let i in cachedMass)
            if (syncAppStamp - cachedMass[i].accessTime >= 5000) delete cachedMass[i];
    }
    function drawTextOnto(canvas, ctx, text, size, colorValue, outlineOn) {
        ctx.font = `${size}px Arial`;
        ctx.lineWidth = outlineOn ? Math.max(~~(size / 10), 2) : 2;
        canvas.width = ctx.measureText(text).width + 2 * ctx.lineWidth;
        canvas.height = 4 * size;
        ctx.font = `${size}px Arial`;
        ctx.lineWidth = outlineOn ? Math.max(~~(size / 10), 2) : 2;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = colorValue || "#FFF";
        ctx.strokeStyle = "#000";
        ctx.translate(canvas.width / 2, 2 * size);
        (ctx.lineWidth !== 1) && ctx.strokeText(text, 0, 0);
        ctx.fillText(text, 0, 0);
    }
    function drawRaw(ctx, x, y, text, size, colorValue, outlineOn) {
        ctx.font = `${size}px Arial`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = outlineOn ? Math.max(~~(size / 10), 2) : 2;
        ctx.fillStyle = colorValue || "#FFF";
        ctx.strokeStyle = "#000";
        if (ctx.lineWidth !== 1) ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    }
    function newNameCache(value, size, cacheKey, colorValue, outlineOn) {
        let canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");
        drawTextOnto(canvas, ctx, value, size, colorValue, outlineOn);
        cachedNames[cacheKey] = cachedNames[cacheKey] || {};
        cachedNames[cacheKey][value] = cachedNames[cacheKey][value] || {};
        cachedNames[cacheKey][value][size] = {
            width: canvas.width,
            height: canvas.height,
            canvas: canvas,
            value: value,
            size: size,
            accessTime: syncAppStamp
        };
        return cachedNames[cacheKey][value][size];
    }
    function newMassCache(size) {
        let canvases = {
            "0": {}, "1": {}, "2": {}, "3": {}, "4": {},
            "5": {}, "6": {}, "7": {}, "8": {}, "9": {}
        };
        for (let value in canvases) {
            let canvas = canvases[value].canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d");
            drawTextOnto(canvas, ctx, value, size);
            canvases[value].canvas = canvas;
            canvases[value].width = canvas.width;
            canvases[value].height = canvas.height;
        }
        cachedMass[size] = {
            canvases: canvases,
            size: size,
            lineWidth: settings.showTextOutline ? Math.max(~~(size / 10), 2) : 2,
            accessTime: syncAppStamp
        };
        return cachedMass[size];
    }
    function toleranceTest(a, b, tolerance) {
        return (a - tolerance) <= b && b <= (a + tolerance);
    }
    function getNameCache(value, size, cacheKey, colorValue, outlineOn) {
        if (!cachedNames[cacheKey] || !cachedNames[cacheKey][value]) return newNameCache(value, size, cacheKey, colorValue, outlineOn);
        let sizes = Object.keys(cachedNames[cacheKey][value]);
        for (let i = 0, l = sizes.length; i < l; i++)
            if (toleranceTest(size, sizes[i], size / 4)) return cachedNames[cacheKey][value][sizes[i]];
        return newNameCache(value, size, cacheKey, colorValue, outlineOn);
    }
    function getMassCache(size) {
        let sizes = Object.keys(cachedMass);
        for (let i = 0, l = sizes.length; i < l; i++)
            if (toleranceTest(size, sizes[i], size / 4)) return cachedMass[sizes[i]];
        return newMassCache(size);
    }
    function resolveNameColor() {
        try {
            let string = String($("#nameColor").val() || "");
            string = string.trim();
            if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(string)) string = "FFF";
            return "#" + string.toUpperCase();
        } catch (e) {
            return "#FFF";
        }
    }
    function drawText(ctx, isMass, x, y, size, drawSize, value, isMine, nameColor) {
        ctx.save();
        if (!value) { ctx.restore(); return; }
        if (size > 500) {
            const outlineOn = settings.showTextOutline !== false;
            const colorValue = isMass ? "#FFF" : (nameColor || (isMine ? resolveNameColor() : "#FFF"));
            return drawRaw(ctx, x, y, value, drawSize, colorValue, outlineOn);
        }
        ctx.imageSmoothingQuality = "high";
        if (isMass) {
            let cache = getMassCache(size);
            cache.accessTime = syncAppStamp;
            let canvases = cache.canvases,
                correctionScale = drawSize / cache.size,
                width = 0; // Calculate width
            for (let i = 0; i < value.length; i++) width += canvases[value[i]].width - 2 * cache.lineWidth;
            ctx.scale(correctionScale, correctionScale);
            x /= correctionScale;
            y /= correctionScale;
            x -= width / 2;
            for (let i = 0; i < value.length; i++) {
                let item = canvases[value[i]];
                if (!item || !item.canvas || !item.canvas.width || !item.canvas.height) continue;
                ctx.drawImage(item.canvas, x, y - item.height / 2);
                x += item.width - 2 * cache.lineWidth;
            }
        } else {
            const outlineOn = settings.showTextOutline !== false;
            const colorValue = nameColor || (isMine ? resolveNameColor() : "#FFF");
            const cacheKey = `${colorValue}|${outlineOn ? 1 : 0}`;
            let cache = getNameCache(value, size, cacheKey, colorValue, outlineOn);
            cache.accessTime = syncAppStamp;
            let canvas = cache.canvas;
            if (!canvas || !canvas.width || !canvas.height) {
                cache = newNameCache(value, size, cacheKey, colorValue, outlineOn);
                canvas = cache.canvas;
                if (!canvas || !canvas.width || !canvas.height) { ctx.restore(); return; }
            }
            let correctionScale = drawSize / cache.size;
            ctx.scale(correctionScale, correctionScale);
            x /= correctionScale;
            y /= correctionScale;
            ctx.drawImage(canvas, x - canvas.width / 2, y - canvas.height / 2);
        }
        ctx.restore();
    }
    function init() {
        mainCanvas = document.getElementById("canvas");
        mainCtx = mainCanvas.getContext("2d");
        chatBox = document.getElementById("chat_textbox");
        domChatList = document.getElementById("message-list");
        // Skin preview elements
        let nickInput = document.getElementById('nick');
        let skinInput = document.getElementById('skin');
        let hatInput = document.getElementById('hatUrl');
        let nameColorInput = document.getElementById('nameColor');
        let skinPreview = document.getElementById('skinPreview');

        function buildNamePayload() {
            const nickVal = (nickInput && nickInput.value) ? nickInput.value.trim() : "";
            const skinVal = (skinInput && skinInput.value) ? skinInput.value.trim() : "";
            const hatVal = (hatInput && hatInput.value) ? hatInput.value.trim() : "";
            const colorVal = (nameColorInput && nameColorInput.value) ? nameColorInput.value.trim() : "";
            return formatNickSkinHat(nickVal, skinVal, hatVal, colorVal);
        }
        function prefetchHatFromInput() {
            if (!hatInput) return;
            const hatCode = buildHatCode(hatInput.value);
            if (hatCode) getHatImageFromCode(hatCode);
        }
        function updateSkinPreview() {
            try {
                let raw = (skinInput && skinInput.value && skinInput.value.trim()) || (nickInput && (function(){
                    let m = /\{([\w\W]+?)\}/.exec(nickInput.value);
                    return m ? m[1] : '';
                })()) || '';
                if (!skinPreview) return;
                raw = raw.trim();
                if (!raw) {
                    skinPreview.style.backgroundImage = "";
                    skinPreview.style.backgroundColor = '#eee';
                    return;
                }
                // Resolve URL similar to cell setSkin logic
                let src = null;
                if (/^data:/i.test(raw) || /:\/\//.test(raw) || /^\/\//.test(raw)) {
                    if (raw.indexOf('//') === 0 && USE_HTTPS) src = 'https:' + raw;
                    else src = raw;
                } else if (raw.indexOf('/') !== -1) {
                    src = raw;
                    if (!/\.(png|jpg|jpeg|gif)$/i.test(src)) src = `${src}.png`;
                } else {
                    src = `${SKIN_URL}${raw}.png`;
                }
                // Load image to ensure validity then set as background
                let img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                    skinPreview.style.backgroundImage = `url('${img.src}')`;
                    skinPreview.style.backgroundColor = '';
                };
                img.onerror = function() {
                    if (img.crossOrigin) {
                        img.crossOrigin = null;
                        img.src = src;
                    } else {
                        skinPreview.style.backgroundImage = '';
                        skinPreview.style.backgroundColor = '#eee';
                    }
                };
                img.src = src;
            } catch (e) { /* ignore */ }
        }

        if (hatInput) {
            try { hatInput.value = localStorage.getItem('mo_hat') || ""; } catch (e) {}
            prefetchHatFromInput();
            hatInput.addEventListener('blur', function() {
                try {
                    const hatVal = (hatInput.value || "").trim();
                    try { localStorage.setItem('mo_hat', hatVal); } catch (e) {}
                    const hatCode = buildHatCode(hatVal);
                    if (hatCode) getHatImageFromCode(hatCode);
                    sendSetNickSkin(buildNamePayload());
                } catch (e) {}
            });
        }
        if (nameColorInput) {
            try { nameColorInput.value = localStorage.getItem('mo_nameColor') || ""; } catch (e) {}
            nameColorInput.addEventListener('blur', function() {
                try {
                    const val = (nameColorInput.value || "").trim();
                    try { localStorage.setItem('mo_nameColor', val); } catch (e) {}
                    sendSetNickSkin(buildNamePayload());
                } catch (e) {}
            });
        }
        if (skinInput) {
            // If page scripts have not already restored the skin value, load from storage here.
            try {
                if (!skinInput.value) {
                    const storedSkin = localStorage.getItem('mo_skin');
                    if (storedSkin) skinInput.value = storedSkin;
                }
            } catch (e) {}
        }
        if (skinInput) {
            skinInput.addEventListener('input', updateSkinPreview);
            skinInput.addEventListener('blur', function() {
                try {
                    let skin = (skinInput.value || "").trim();
                    try { localStorage.setItem('mo_skin', skin); } catch (e) {}
                    sendSetNickSkin(buildNamePayload());
                } catch (e) {}
            });
            // ensure preview on load if value already present
            if (skinInput.value && skinInput.value.trim()) updateSkinPreview();
        }
        if (nickInput) {
            nickInput.addEventListener('input', updateSkinPreview);
            nickInput.addEventListener('blur', function() {
                try {
                    sendSetNickSkin(buildNamePayload());
                } catch (e) {}
            });
            nickInput.addEventListener('keydown', function(e) {
                if (e.keyCode === 13) { // Enter: commit name change
                    try { nickInput.blur(); } catch (er) {}
                }
            });
        }
        // initialize preview from any existing values
        updateSkinPreview();
        soundsVolume = document.getElementById("soundsVolume");
        mainCanvas.focus();
        function handleScroll(event) {
            const delta = (event.wheelDelta / -120) || event.detail || 0;
            const base = settings.infiniteZoom ? 0.90 : 0.95;
            const sensitivity = clampNumber(settings.scrollZoomRate || 100, 10, 400) / 100;
            const adjustedBase = 1 - (1 - base) * sensitivity;
            mouse.z *= Math.pow(adjustedBase, delta);
            if (!settings.infiniteZoom && mouse.z < 1) mouse.z = 1;
            // Relax zoom ceiling when infiniteZoom is on
            const maxZoom = settings.infiniteZoom ? 1e6 : (4 / mouse.z);
            if (mouse.z > maxZoom) mouse.z = maxZoom;
            if (settings.infiniteZoom && mouse.z < 0.05) mouse.z = 0.05;
        }
        if (/firefox/i.test(navigator.userAgent)) document.addEventListener("DOMMouseScroll", handleScroll, 0);
        else document.body.onmousewheel = handleScroll;
        // Load user bindings (if any) and fall back to defaults.
        let __userBindings = {};
        function loadBindings() {
            try {
                __userBindings = JSON.parse(localStorage.getItem('mo_bindings')) || {};
                ['minionSplit','minionEject','minionFreeze','minionCollect','minionFollow','multiSplitShift','multiSplitA','multiSplitD'].forEach(k => { delete __userBindings[k]; });
            } catch (e) { __userBindings = {}; }
            Object.assign(__B, DEFAULT_BINDINGS, __userBindings);
        }
        const DEFAULT_BINDINGS = {
            split: 32, eject: 87, minionSplit: 0, minionEject: 0, minionFreeze: 0, minionCollect: 0, minionFollow: 0,
            multiSplitShift: 0, multiSplitA: 0, multiSplitD: 0,
            doubleSplit: 0, tripleSplit: 0, quadSplit: 0, split32: 0, split64: 0, diagonalLinesplit: 0,
            lineLockToggle: 87, // default W
            teleportControl: 0,
            respawn: 82
        };
        const __B = Object.assign({}, DEFAULT_BINDINGS);
        loadBindings();
        let diagLockActive = false;
        // Mouse bindings: use -1 (LMB), -2 (MMB), -3 (RMB) in mo_bindings to map a hotkey to a mouse button.
        function mouseButtonToCode(btn) {
            if (btn === 0) return -1;
            if (btn === 1) return -2;
            if (btn === 2) return -3;
            return null;
        }
        function isMouseBinding(code) {
            if (code == null) return false;
            return Object.keys(__B).some(k => __B[k] === code);
        }

        // Teleport control state (client-side)
        let teleportSelecting = false;
        let teleportDragging = false;
        let explodeSelecting = false;
        // OP-only player id lookup state lives in outer scope (idLookupSelecting)
        let lineLockActive = false;
        let lineLockDir = null;
        let lineLockInterval = null;
        const lineLockIndicator = document.getElementById('lineLockIndicator');

        // Minimal chat command guard: let server handle /mass; show warning if not OP but still send
        function handleChatCommand(msg) {
            if (!msg || msg[0] !== '/') return false;
            const parts = msg.trim().split(/\s+/);
            const command = (parts[0] || '').toLowerCase();
            if (command !== '/mass') return false;
            if (!isOpClient()) {
                pushLocalMessage("OP only: server will enforce /mass", "#C44");
                return false; // allow server to handle
            }
            return false; // allow server to handle
        }

        wHandle.onkeydown = function(event) {
            const kc = event.keyCode;
            // Enter/Chat
            if (kc === 13) {
                if (overlayShown) return;
                if (settings.hideChat) return;
                if (isTyping) {
                    chatBox.blur();
                    let chatText = chatBox.value;
                    if (chatText.length > 0) {
                        if (!handleChatCommand(chatText)) sendChat(chatText);
                    }
                    chatBox.value = "";
                } else chatBox.focus();
                return;
            }

            // OP: Shift+G -> teleport to mouse (forced here to avoid conflicts with custom binds)
            if (kc === 71 && event.shiftKey) {
                if (isTyping || overlayShown) return;
                try { wsSend(UINT8[39]); } catch (e) {}
                return;
            }

            // Shift+Q -> Explode mode (OP only): click a player to max-split them
            if (kc === 81 && event.shiftKey) {
                if (isTyping || overlayShown) return;
                explodeSelecting = !explodeSelecting;
                if (explodeSelecting) {
                    pushLocalMessage("Explode mode: click a player to force max split.", "#f66");
                } else {
                    pushLocalMessage("Explode mode cancelled.", "#888");
                }
                return;
            }

            // Q (minion follow) - keep original behavior keyed to mapped value
            if (kc === __B.minionFollow) {
                if (isTyping || overlayShown || pressed.q) return;
                wsSend(UINT8[18]);
                pressed.q = 1;
                return;
            }

            // Line lock toggle (W by default). Toggle on: lock direction to mouse and keep refreshing. Toggle off: unlock.
            if (__B.lineLockToggle && kc === __B.lineLockToggle) {
                if (isTyping || overlayShown) return;
                if (lineLockActive) {
                    if (lineLockInterval) { clearInterval(lineLockInterval); lineLockInterval = null; }
                    lineLockActive = false;
                    lineLockDir = null;
                    sendLinesplitLock(0, 0);
                    if (lineLockIndicator) lineLockIndicator.style.display = 'none';
                    return;
                }
                const cx = mainCanvas.width / 2;
                const cy = mainCanvas.height / 2;
                const mx = isNaN(mouse.x) ? cx : mouse.x;
                const my = isNaN(mouse.y) ? cy : mouse.y;
                const center = getOwnCenter() || { x: camera.x, y: camera.y };
                const worldMouse = clientToWorld(mx, my);
                const dirX = worldMouse.x - center.x;
                const dirY = worldMouse.y - center.y;
                const mag = Math.sqrt(dirX * dirX + dirY * dirY);
                if (!mag) return;
                const ndx = dirX / mag;
                const ndy = dirY / mag;
                lineLockDir = { x: ndx, y: ndy };
                sendLinesplitLock(ndx, ndy);
                lineLockActive = true;
                if (lineLockIndicator) lineLockIndicator.style.display = 'block';
                if (lineLockInterval) { clearInterval(lineLockInterval); }
                lineLockInterval = setInterval(function() {
                    if (!lineLockDir || !lineLockActive) return;
                    sendLinesplitLock(lineLockDir.x, lineLockDir.y);
                }, 250);
                return;
            }

            // Eject / W mapping
            if (kc === __B.eject) {
                if (isTyping || overlayShown) return;
                // If this key is also the line-lock toggle, suppress eject so it only acts as an activator
                if (__B.lineLockToggle && __B.lineLockToggle === __B.eject) return;
                // Send an immediate eject and then continue sending while held
                wsSend(UINT8[21]);
                pressed.w = 1;
                // If user holds eject while splitting, periodic ejects help ensure server receives them
                try {
                    if (!wHandle.__ejectInterval) {
                        wHandle.__ejectInterval = setInterval(function() { wsSend(UINT8[21]); }, 120);
                    }
                } catch (e) {}
                return;
            }

            // Minion split
            if (kc === __B.minionSplit) {
                if (isTyping || overlayShown) return;
                wsSend(UINT8[22]);
                pressed.e = 1;
                return;
            }

            // Minion eject
            if (kc === __B.minionEject) {
                if (isTyping || overlayShown) return;
                wsSend(UINT8[23]);
                pressed.r = 1;
                return;
            }

            // Minion freeze
            if (kc === __B.minionFreeze) {
                if (isTyping || overlayShown || pressed.t) return;
                wsSend(UINT8[24]);
                pressed.t = 1;
                return;
            }

            // Minion collect
            if (kc === __B.minionCollect) {
                if (isTyping || overlayShown || pressed.p) return;
                wsSend(UINT8[25]);
                pressed.p = 1;
                return;
            }

            // Diagonal linesplit (locked straight 8x split toward cursor)
            if (__B.diagonalLinesplit && kc === __B.diagonalLinesplit) {
                if (isTyping || overlayShown) return;
                doDiagonalLinesplit();
                return;
            }

            // Multi-split shortcuts (mapped keys) - accumulate so split can also fire on same keypress
            let queuedSplits = [];
            if (__B.multiSplitShift && kc === __B.multiSplitShift) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => doSplitCount(16, 50));
            }
            if (__B.multiSplitA && kc === __B.multiSplitA) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => doSplitCount(3, 50));
            }
            if (__B.multiSplitD && kc === __B.multiSplitD) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => doSplitCount(2, 50));
            }

            // Dedicated multi-split keys requested (double/triple/quad/32/64)
            if (__B.doubleSplit && kc === __B.doubleSplit) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => doMultiSplitCells(4)); // 2 iterations -> ~4 cells
            }
            if (__B.tripleSplit && kc === __B.tripleSplit) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => doMultiSplitCells(8));
            }
            if (__B.quadSplit && kc === __B.quadSplit) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => doMultiSplitCells(16));
            }
            if (__B.split32 && kc === __B.split32) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => doMultiSplitCells(32));
            }
            if (__B.split64 && kc === __B.split64) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => doMultiSplitCells(64));
            }

            // Split (placed after multi-splits so shared bindings can run both)
            if (kc === __B.split) {
                if (isTyping || overlayShown) return;
                queuedSplits.push(() => wsSend(UINT8[17]));
            }

            if (queuedSplits.length) {
                for (let i = 0; i < queuedSplits.length; i++) {
                    try { queuedSplits[i](); } catch (e) {}
                }
                return;
            }

            // Teleport-control toggle (only if bound)
            if (__B.teleportControl && kc === __B.teleportControl) {
                if (isTyping || overlayShown) return;
                teleportSelecting = !teleportSelecting;
                // notify server/client via chat message for feedback
                sendChat(teleportSelecting ? "Teleport mode: SELECT a player (click) and drag." : "Teleport mode: CANCELLED.");
                return;
            }

            // Respawn key (available to all players)
            if (__B.respawn && kc === __B.respawn) {
                if (isTyping || overlayShown) return;
                // send single-byte opcode 45 to request respawn
                // Suppress overlay for a short window to avoid flicker
                try { window.__suppressOverlayUntil = Date.now() + 3000; } catch (e) {}
                try { if (overlayShown) hideOverlay(); } catch (e) {}
                wsSend(UINT8[45]);
                return;
            }

            // Shift+X: OP-only player id lookup (click a player after activating)
            if (event.shiftKey && kc === 88) {
                if (isTyping || overlayShown || pressed.x) return;
                if (!isOpClient()) {
                    pushLocalMessage("Player-ID lookup is OP-only. Enable OP and try again.", "#C44");
                    pressed.x = 1;
                    return;
                }
                idLookupSelecting = true;
                pushLocalMessage("ID lookup active: click a player to show their id.", settings.darkTheme ? "#DDD" : "#444");
                pressed.x = 1;
                return;
            }

            // Additional mapped or fixed keys preserved - fall back to original codes for other actions
            switch (kc) {
                case 79: // O
                    if (isTyping || overlayShown || pressed.o || !event.shiftKey) break;
                    wsSend(UINT8[26]);
                    pressed.o = 1;
                    break;
                case 77: // M
                    if (isTyping || overlayShown || pressed.m || !event.shiftKey) break;
                    wsSend(UINT8[27]);
                    pressed.m = 1;
                    break;
                case 73: // I
                    if (isTyping || overlayShown || pressed.i || !event.shiftKey) break;
                    wsSend(UINT8[28]);
                    pressed.i = 1;
                    break;
                case 89: // Y
                    if (isTyping || overlayShown || !event.shiftKey) break;
                    wsSend(UINT8[30]);
                    pressed.y = 1;
                    break;
                case 85: // U
                    if (isTyping || overlayShown || !event.shiftKey) break;
                    wsSend(UINT8[31]);
                    pressed.u = 1;
                    break;
                case 75: // K
                    if (isTyping || overlayShown || pressed.k || !event.shiftKey) break;
                    wsSend(UINT8[29]);
                    pressed.k = 1;
                    break;
                case 76: // L
                    if (isTyping || overlayShown || pressed.l || !event.shiftKey) break;
                    wsSend(UINT8[33]);
                    pressed.l = 1;
                    break;
                case 72: // H
                    if (isTyping || overlayShown || pressed.h || !event.shiftKey) break;
                    wsSend(UINT8[34]);
                    pressed.h = 1;
                    break;
                case 90: // Z
                    if (isTyping || overlayShown || !event.shiftKey) break;
                    wsSend(UINT8[35]);
                    pressed.z = 1;
                    break;
                case 88: // X
                    if (isTyping || overlayShown || pressed.x) break;
                    wsSend(UINT8[36]);
                    pressed.x = 1;
                    break;
                case 83: // S
                    if (isTyping || overlayShown || !event.shiftKey) break;
                    wsSend(UINT8[37]);
                    pressed.s = 1;
                    break;
                case 67: // C
                    if (isTyping || overlayShown || pressed.c || !event.shiftKey) break;
                    wsSend(UINT8[38]);
                    pressed.c = 1;
                    break;
                case 71: // J
                    if (isTyping || overlayShown || !event.shiftKey) break;
                    wsSend(UINT8[39]);
                    pressed.j = 1;
                    break;
                case 74: // G
                    if (isTyping || overlayShown || !event.shiftKey) break;
                    wsSend(UINT8[40]);
                    pressed.g = 1;
                    break;
                case 66: // B
                    if (isTyping || overlayShown || pressed.b || !event.shiftKey) break;
                    wsSend(UINT8[41]);
                    pressed.b = 1;
                    break;
                case 86: // V
                    if (isTyping || overlayShown || !event.shiftKey) break;
                    wsSend(UINT8[42]);
                    pressed.v = 1;
                    break;
                case 78: // N
                    if (isTyping || overlayShown || !event.shiftKey) break;
                    wsSend(UINT8[43]);
                    pressed.n = 1;
                    break;
                case 27: // Esc
                    if (pressed.esc) break;
                    overlayShown ? hideOverlay() : showOverlay();
                    pressed.esc = 1;
                    break;
            }
        };

        wHandle.onkeyup = function(event) {
            const kc = event.keyCode;
            if (kc === __B.split) {
                pressed.space = 0;
                return;
            }
            if (kc === __B.eject) {
                // stop periodic ejects when key released
                pressed.w = 0;
                try { if (wHandle.__ejectInterval) { clearInterval(wHandle.__ejectInterval); wHandle.__ejectInterval = null; } } catch (e) {}
                return;
            }
            if (kc === __B.minionFollow) {
                if (pressed.q) wsSend(UINT8[19]);
                pressed.q = 0;
                return;
            }
            if (kc === __B.minionSplit) {
                pressed.e = 0;
                return;
            }
            if (kc === __B.minionEject) {
                pressed.r = 0;
                return;
            }
            if (kc === __B.minionFreeze) {
                pressed.t = 0;
                return;
            }
            if (kc === __B.minionCollect) {
                pressed.p = 0;
                return;
            }

            switch (kc) {
                case 79: // O
                    pressed.o = 0;
                    break;
                case 77: // M
                    pressed.m = 0;
                    break;
                case 73: // I
                    pressed.i = 0;
                    break;
                case 89: // Y
                    pressed.y = 0;
                    break;
                case 85: // U
                    pressed.u = 0;
                    break;
                case 75: // K
                    pressed.k = 0;
                    break;
                case 76: // L
                    pressed.l = 0;
                    break;
                case 72: // H
                    pressed.h = 0;
                    break;
                case 90: // Z
                    pressed.z = 0;
                    break;
                case 88: // X
                    pressed.x = 0;
                    break;
                case 83: // S
                    pressed.s = 0;
                    break;
                case 67: // C
                    pressed.c = 0;
                    break;
                case 74: // G
                    pressed.g = 0;
                    break;
                case 71: // J
                    pressed.j = 0;
                    break;
                case 66: // B
                    pressed.b = 0;
                    break;
                case 86: // V
                    pressed.v = 0;
                    break;
                case 78: // N
                    pressed.n = 0;
                    break;
                case 27: // Esc
                    pressed.esc = 0;
            }
        };
        chatBox.onblur = function() {
            isTyping = 0;
            drawChat();
        };
        chatBox.onfocus = function() {
            isTyping = 1;
            drawChat();
        };
        mainCanvas.onmousemove = function(event) {
            // Ignore real mouse while a freeze position is active
            if (frozenMouseUntil && Date.now() < frozenMouseUntil) return;
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };

        // Convert client coords to world coords
        function clientToWorld(cx, cy) {
            return {
                x: (cx - mainCanvas.width / 2) / camera.z + camera.x,
                y: (cy - mainCanvas.height / 2) / camera.z + camera.y
            };
        }
        function findTopCellAt(worldX, worldY) {
            let hit = null;
            for (let i = cells.list.length - 1; i >= 0; i--) {
                let c = cells.list[i];
                if (!c || c.destroyed) continue;
                let dx = c.x - worldX, dy = c.y - worldY;
                if (dx * dx + dy * dy <= c.s * c.s) {
                    hit = c; break;
                }
            }
            return hit;
        }
        function lookupPlayerIdForCell(cell) {
            if (!cell) return null;
            let best = null, bestDist = Infinity;
            let list = window.__minimapPlayers;
            if (!list || !list.length) return null;
            for (let i = 0; i < list.length; i++) {
                let p = list[i];
                if (!p) continue;
                let nameMatch = cell.name && p.name && cell.name === p.name;
                let dx = cell.x - p.x, dy = cell.y - p.y;
                let dist2 = dx * dx + dy * dy;
                if (nameMatch) return p;
                if (dist2 < bestDist) {
                    bestDist = dist2;
                    best = p;
                }
            }
            return best;
        }
        function handlePlayerIdLookupClick(event) {
            let world = clientToWorld(event.clientX, event.clientY);
            let hit = findTopCellAt(world.x, world.y);
            if (!hit) {
                pushLocalMessage("No player under cursor.", "#C44");
                return;
            }
            let player = lookupPlayerIdForCell(hit);
            if (player && player.id != null) {
                pushLocalMessage(`Player "${player.name || "(no name)"}" id: ${player.id}.`, settings.darkTheme ? "#DDD" : "#444");
            } else {
                pushLocalMessage("Player id not available yet. Try again after minimap updates.", "#C44");
            }
        }

        // Send teleport-select packet (opcode 44) - start/stop with target cell id
        function sendTeleportPacket(targetCellId, action) {
            // action: 1=start, 0=stop
            // Use little-endian writer to match server parsing (server expects little-endian uint32)
            let writer = new Writer(1);
            writer.setUint8(44); // custom opcode
            writer.setUint32(targetCellId >>> 0);
            writer.setUint8(action ? 1 : 0);
            // Debug: log outgoing teleport packet and target id
            try {
                console.debug("Sending teleport packet", {targetId: targetCellId, action: action, bytes: writer.build()});
            } catch (e) {}
            wsSend(writer);
        }

        // Send explode-target packet (opcode 47) - instantly force target to max cells (OP only)
        function sendExplodePacket(targetCellId) {
            let writer = new Writer(1);
            writer.setUint8(47);
            writer.setUint32(targetCellId >>> 0);
            try { console.debug("Sending explode packet", {targetId: targetCellId, bytes: writer.build()}); } catch (e) {}
            wsSend(writer);
        }

        // Send nick/skin update packet (opcode 46) so server stores new values mid-game
        function sendSetNickSkin(text) {
            if (!ws || ws.readyState !== 1) return;
            try {
                let writer = new Writer(1);
                writer.setUint8(46);
                writer.setStringUTF8(text || "");
                wsSend(writer);
                console.debug && console.debug("Sent setNickSkin:", text);
            } catch (e) { console.error("sendSetNickSkin error:", e); }
        }

        // Send linesplit lock packet (opcode 60) with a direction vector; zero vector clears the lock
        function sendLinesplitLock(dirX, dirY) {
            if (!ws || ws.readyState !== 1) return;
            let writer = new Writer(1);
            writer.setUint8(60);
            writer.setFloat64(dirX);
            writer.setFloat64(dirY);
            wsSend(writer);
        }

        // Helper to send a single split packet
        function sendSplitOnce() {
            if (!ws || ws.readyState !== 1) return;
            wsSend(UINT8[17]);
        }

        // Send `count` split packets spaced by `interval` ms
        function doSplitCount(count, interval) {
            interval = interval || 60;
            for (let i = 0; i < count; i++) {
                setTimeout(sendSplitOnce, i * interval);
            }
        }

        // Request splits to reach approximately `targetCells` (power of two) by sending log2(target) splits
        function doMultiSplitCells(targetCells) {
            if (!targetCells || targetCells <= 1) return;
            const iterations = Math.max(1, Math.round(Math.log2(targetCells)));
            doSplitCount(iterations, 60);
        }

        // Send a server-side locked linesplit burst (opcode 61)
        function sendLinesplitBurst(dirX, dirY, repeats) {
            if (!ws || ws.readyState !== 1) return;
            const writer = new Writer(1);
            writer.setUint8(61);
            writer.setFloat64(dirX);
            writer.setFloat64(dirY);
            writer.setUint8(repeats || 3);
            wsSend(writer);
        }

        // Diagonal trigger: simulate pressing line-lock (W) and a user split key (V) once
        function doDiagonalLinesplit() {
            triggerKeyCode(87); // W lock
            triggerKeyCode(86); // V split
            // keep indicator visible briefly
            if (lineLockIndicator) lineLockIndicator.style.display = 'block';
            setTimeout(() => {
                triggerKeyCode(87); // W unlock shortly after
                if (lineLockIndicator) lineLockIndicator.style.display = 'none';
            }, 500);
        }

        function triggerKeyCode(kc) {
            wHandle.onkeydown({
                keyCode: kc,
                preventDefault: () => {},
                stopPropagation: () => {},
                shiftKey: false,
                ctrlKey: false,
                altKey: false
            });
        }

        // Get an instant (unsmoothed) center point of our own cells to aim from
        function getOwnCenter() {
            if (!cells || !cells.mine || !cells.byId) return null;
            let sumX = 0, sumY = 0, count = 0;
            for (let i = 0; i < cells.mine.length; i++) {
                const id = cells.mine[i];
                const cell = cells.byId.get(id);
                if (!cell || cell.destroyed) continue;
                sumX += cell.x;
                sumY += cell.y;
                count++;
            }
            if (!count) return null;
            return { x: sumX / count, y: sumY / count };
        }

        // Block default context menu (so RMB hotkeys don't open it)
        document.addEventListener("contextmenu", function(e) { e.preventDefault(); }, false);
        mainCanvas.oncontextmenu = function(e) { e.preventDefault(); return false; };

        // Listen for live keybind changes coming from the UI (index.html) and reload bindings without refresh
        window.addEventListener("mo_bindings_updated", function() {
            loadBindings();
        });

        mainCanvas.onmousedown = function(event) {
            // Mouse hotkeys (LMB=-1, MMB=-2, RMB=-3) via mo_bindings
            const mcode = mouseButtonToCode(event.button);
            if (isMouseBinding(mcode)) {
                event.preventDefault();
                event.stopPropagation();
                wHandle.onkeydown({
                    keyCode: mcode,
                    shiftKey: event.shiftKey,
                    ctrlKey: event.ctrlKey,
                    altKey: event.altKey,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                });
                return;
            }
            if (idLookupSelecting) {
                idLookupSelecting = false;
                handlePlayerIdLookupClick(event);
                return;
            }
            if (explodeSelecting) {
                if (!ws || ws.readyState !== 1) return;
                let world = clientToWorld(event.clientX, event.clientY);
                let hit = findTopCellAt(world.x, world.y);
                if (!hit) {
                    pushLocalMessage("No player under cursor.", "#C44");
                    return;
                }
                sendExplodePacket(hit.id);
                pushLocalMessage("Explode sent to target (explode mode stays ON).", "#f66");
                return;
            }
            if (!teleportSelecting || !ws || ws.readyState !== 1) return;
            // compute clicked world coords
            let world = clientToWorld(event.clientX, event.clientY);
            // find top-most cell under cursor
            let hit = findTopCellAt(world.x, world.y);
            if (!hit) return;
            // notify server to start teleporting this target (send cell id)
            sendTeleportPacket(hit.id, 1);
            teleportDragging = true;
        };

        mainCanvas.onmouseup = function(event) {
            const mcode = mouseButtonToCode(event.button);
            if (isMouseBinding(mcode)) {
                event.preventDefault();
                event.stopPropagation();
                wHandle.onkeyup({
                    keyCode: mcode,
                    shiftKey: event.shiftKey,
                    ctrlKey: event.ctrlKey,
                    altKey: event.altKey,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                });
                return;
            }
            if (!teleportDragging) return;
            teleportDragging = false;
            teleportSelecting = false;
            // send stop packet (target id 0)
            sendTeleportPacket(0, 0);
            sendChat("Teleport mode: COMPLETED.");
        };
        setInterval(() => { // Send mouse update
            if (frozenMouseUntil && Date.now() < frozenMouseUntil && frozenMousePos) {
                sendMouseMove(frozenMousePos.x, frozenMousePos.y);
            } else {
                sendMouseMove((mouse.x - mainCanvas.width / 2) / camera.z + camera.x, (mouse.y - mainCanvas.height / 2) / camera.z + camera.y);
                frozenMousePos = null;
                frozenMouseUntil = 0;
            }
        }, 60);
        wHandle.onresize = function() {
            let cW = mainCanvas.width = wHandle.innerWidth,
                cH = mainCanvas.height = wHandle.innerHeight;
            camera.viewMult = Math.sqrt(Math.min(cH / 1080, cW / 1920));
        };
        wHandle.onresize();
        log.info(`Init completed in ${Date.now() - DATE}ms`);
        gameReset();
        showOverlay();
        let wsTarget = DEFAULT_WSS;
        if (settings.allowGETipSet && wHandle.location.search) {
            let div = /ip=([\w\W]+):([0-9]+)/.exec(wHandle.location.search.slice(1));
            if (div) wsTarget = `${div[1]}:${div[2]}`;
        }
        wsInit(wsTarget);
        window.requestAnimationFrame(drawGame);
    }
    wHandle.setServer = function(arg) {
        if (WS_URL === arg) return;
        wsInit(arg);
    };
    wHandle.formatNickSkinHat = formatNickSkinHat;
    wHandle.setSkins = function(arg) {
        settings.showSkins = arg;
    };
    wHandle.setOtherSkins = function(arg) {
        settings.showOtherSkins = arg;
    };
    wHandle.setNames = function(arg) {
        settings.showNames = arg;
        drawLeaderboard();
    };
    wHandle.setOtherNames = function(arg) {
        settings.showOtherNames = arg;
    };
    wHandle.setColors = function(arg) {
        settings.showColor = !arg;
    };
    wHandle.setChatHide = function(arg) {
        settings.hideChat = arg;
        settings.hideChat ? wjQuery('#chat_textbox').hide() : wjQuery('#chat_textbox').show();
    };
    wHandle.setMinimap = function(arg) {
        settings.showMinimap = !arg;
    };
    wHandle.setGrid = function(arg) {
        settings.hideGrid = arg;
    };
    wHandle.setFood = function(arg) {
        settings.hideFood = arg;
    };
    wHandle.setStats = function(arg) {
        settings.hideStats = arg;
    };
    wHandle.setShowMass = function(arg) {
        settings.showMass = arg;
    };
    wHandle.setDarkTheme = function(arg) {
        settings.darkTheme = arg;
        drawStats();
    };
    wHandle.setCellBorder = function(arg) {
        settings.cellBorders = arg;
    };
    wHandle.setJelly = function(arg) {
        settings.jellyPhysics = arg;
    };
    wHandle.setTextOutline = function(arg) {
        settings.showTextOutline = arg;
    };
    wHandle.setZoom = function(arg) {
        settings.infiniteZoom = arg;
    };
    wHandle.setTransparency = function(arg) {
        settings.transparency = arg;
    };
    wHandle.setMapBorders = function(arg) {
        settings.mapBorders = arg;
    };
    wHandle.setSectors = function(arg) {
        settings.sectors = arg;
    };
    wHandle.setCellPos = function(arg) {
        settings.showPos = arg;
    };
    wHandle.setAutoZoom = function(arg) {
        settings.autoZoom = arg;
        try { wHandle.localStorage.setItem("checkbox-21", arg); } catch (e) {}
    };
    wHandle.setAutoRespawn = function(arg) {
        settings.autoRespawn = arg;
        if (!arg) autoRespawnArmed = false;
        try { wHandle.localStorage.setItem("checkbox-22", arg); } catch (e) {}
    };
    wHandle.setDrawDelay = function(ms) {
        const value = clampNumber(ms, 0, 400);
        settings.drawDelayMs = value;
        try { wHandle.localStorage.setItem("mo_drawDelay", value); } catch (e) {}
    };
    wHandle.setCameraPanSpeed = function(val) {
        const value = clampNumber(val, 1, 200);
        settings.cameraPanSpeed = value;
        try { wHandle.localStorage.setItem("mo_cameraPan", value); } catch (e) {}
    };
    wHandle.setCameraZoomSpeed = function(val) {
        const value = clampNumber(val, 1, 200);
        settings.cameraZoomSpeed = value;
        try { wHandle.localStorage.setItem("mo_cameraZoom", value); } catch (e) {}
    };
    wHandle.setScrollZoomRate = function(val) {
        const value = clampNumber(val, 10, 400);
        settings.scrollZoomRate = value;
        try { wHandle.localStorage.setItem("mo_scrollZoomRate", value); } catch (e) {}
    };
    wHandle.spectate = function() {
        wsSend(UINT8[1]);
        stats.maxScore = 0;
        hideOverlay();
    };
    wHandle.openSkinsList = function() {
        if (wjQuery("#inPageModalTitle").text() === "Skins") return;
        wjQuery.get("include/gallery.php").then(function(data) {
            wjQuery("#inPageModalTitle").text("Skins");
            wjQuery("#inPageModalBody").html(data);
        });
    };
    wHandle.play = function(arg) {
        sendPlay(arg);
        hideOverlay();
    };
    wHandle.onload = init;
})(window, window.jQuery);
