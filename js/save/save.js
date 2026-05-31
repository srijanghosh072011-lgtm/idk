/* ============================================================================
 * save.js  —  Persistence (localStorage)
 * ----------------------------------------------------------------------------
 * Stores serialized game state under named slots. Supports multiple save slots
 * plus a dedicated autosave slot. Falls back to an in-memory store when
 * localStorage is unavailable (e.g. running under node for tests).
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;

  var PREFIX = 'gaffer_save_';
  var memFallback = {};

  function store() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* sandboxed */ }
    return {
      getItem: function (k) { return memFallback[k] != null ? memFallback[k] : null; },
      setItem: function (k, v) { memFallback[k] = v; },
      removeItem: function (k) { delete memFallback[k]; },
      get length() { return Object.keys(memFallback).length; },
      key: function (i) { return Object.keys(memFallback)[i]; }
    };
  }

  var Save = {
    save: function (slot, state) {
      var payload = { savedAt: Date.now(), meta: state._meta || {}, state: state };
      try {
        store().setItem(PREFIX + slot, JSON.stringify(payload));
        return true;
      } catch (e) {
        console.error('Save failed:', e);
        return false;
      }
    },
    load: function (slot) {
      var raw = store().getItem(PREFIX + slot);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    },
    has: function (slot) { return store().getItem(PREFIX + slot) != null; },
    remove: function (slot) { store().removeItem(PREFIX + slot); },
    list: function () {
      var s = store(), out = [];
      for (var i = 0; i < s.length; i++) {
        var key = s.key(i);
        if (key && key.indexOf(PREFIX) === 0) {
          var slot = key.slice(PREFIX.length);
          var data = null;
          try { data = JSON.parse(s.getItem(key)); } catch (e) {}
          out.push({ slot: slot, savedAt: data ? data.savedAt : 0, meta: data ? data.meta : {} });
        }
      }
      out.sort(function (a, b) { return b.savedAt - a.savedAt; });
      return out;
    }
  };

  G.Save = Save;
})(typeof window !== 'undefined' ? window : globalThis);
