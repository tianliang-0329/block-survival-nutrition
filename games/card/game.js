/* Based on Slay the Web (AGPL-3.0-or-later). See LICENSE-SlayTheWeb.txt. */
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/immer/dist/immer.mjs
  var NOTHING = /* @__PURE__ */ Symbol.for("immer-nothing");
  var DRAFTABLE = /* @__PURE__ */ Symbol.for("immer-draftable");
  var DRAFT_STATE = /* @__PURE__ */ Symbol.for("immer-state");
  var errors = true ? [
    // All error codes, starting by 0:
    function(plugin) {
      return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`;
    },
    function(thing) {
      return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`;
    },
    "This object has been frozen and should not be mutated",
    function(data) {
      return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;
    },
    "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
    "Immer forbids circular references",
    "The first or second argument to `produce` must be a function",
    "The third argument to `produce` must be a function or undefined",
    "First argument to `createDraft` must be a plain object, an array, or an immerable object",
    "First argument to `finishDraft` must be a draft returned by `createDraft`",
    function(thing) {
      return `'current' expects a draft, got: ${thing}`;
    },
    "Object.defineProperty() cannot be used on an Immer draft",
    "Object.setPrototypeOf() cannot be used on an Immer draft",
    "Immer only supports deleting array indices",
    "Immer only supports setting array indices and the 'length' property",
    function(thing) {
      return `'original' expects a draft, got: ${thing}`;
    }
    // Note: if more errors are added, the errorOffset in Patches.ts should be increased
    // See Patches.ts for additional errors
  ] : [];
  function die(error, ...args) {
    if (true) {
      const e = errors[error];
      const msg = typeof e === "function" ? e.apply(null, args) : e;
      throw new Error(`[Immer] ${msg}`);
    }
    throw new Error(
      `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
    );
  }
  var getPrototypeOf = Object.getPrototypeOf;
  function isDraft(value) {
    return !!value && !!value[DRAFT_STATE];
  }
  function isDraftable(value) {
    if (!value)
      return false;
    return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
  }
  var objectCtorString = Object.prototype.constructor.toString();
  var cachedCtorStrings = /* @__PURE__ */ new WeakMap();
  function isPlainObject(value) {
    if (!value || typeof value !== "object")
      return false;
    const proto = Object.getPrototypeOf(value);
    if (proto === null || proto === Object.prototype)
      return true;
    const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
    if (Ctor === Object)
      return true;
    if (typeof Ctor !== "function")
      return false;
    let ctorString = cachedCtorStrings.get(Ctor);
    if (ctorString === void 0) {
      ctorString = Function.toString.call(Ctor);
      cachedCtorStrings.set(Ctor, ctorString);
    }
    return ctorString === objectCtorString;
  }
  function each(obj, iter, strict = true) {
    if (getArchtype(obj) === 0) {
      const keys = strict ? Reflect.ownKeys(obj) : Object.keys(obj);
      keys.forEach((key) => {
        iter(key, obj[key], obj);
      });
    } else {
      obj.forEach((entry, index) => iter(index, entry, obj));
    }
  }
  function getArchtype(thing) {
    const state2 = thing[DRAFT_STATE];
    return state2 ? state2.type_ : Array.isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
  }
  function has(thing, prop) {
    return getArchtype(thing) === 2 ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
  }
  function set(thing, propOrOldValue, value) {
    const t = getArchtype(thing);
    if (t === 2)
      thing.set(propOrOldValue, value);
    else if (t === 3) {
      thing.add(value);
    } else
      thing[propOrOldValue] = value;
  }
  function is(x, y) {
    if (x === y) {
      return x !== 0 || 1 / x === 1 / y;
    } else {
      return x !== x && y !== y;
    }
  }
  function isMap(target) {
    return target instanceof Map;
  }
  function isSet(target) {
    return target instanceof Set;
  }
  function latest(state2) {
    return state2.copy_ || state2.base_;
  }
  function shallowCopy(base, strict) {
    if (isMap(base)) {
      return new Map(base);
    }
    if (isSet(base)) {
      return new Set(base);
    }
    if (Array.isArray(base))
      return Array.prototype.slice.call(base);
    const isPlain = isPlainObject(base);
    if (strict === true || strict === "class_only" && !isPlain) {
      const descriptors = Object.getOwnPropertyDescriptors(base);
      delete descriptors[DRAFT_STATE];
      let keys = Reflect.ownKeys(descriptors);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const desc = descriptors[key];
        if (desc.writable === false) {
          desc.writable = true;
          desc.configurable = true;
        }
        if (desc.get || desc.set)
          descriptors[key] = {
            configurable: true,
            writable: true,
            // could live with !!desc.set as well here...
            enumerable: desc.enumerable,
            value: base[key]
          };
      }
      return Object.create(getPrototypeOf(base), descriptors);
    } else {
      const proto = getPrototypeOf(base);
      if (proto !== null && isPlain) {
        return { ...base };
      }
      const obj = Object.create(proto);
      return Object.assign(obj, base);
    }
  }
  function freeze(obj, deep = false) {
    if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
      return obj;
    if (getArchtype(obj) > 1) {
      Object.defineProperties(obj, {
        set: dontMutateMethodOverride,
        add: dontMutateMethodOverride,
        clear: dontMutateMethodOverride,
        delete: dontMutateMethodOverride
      });
    }
    Object.freeze(obj);
    if (deep)
      Object.values(obj).forEach((value) => freeze(value, true));
    return obj;
  }
  function dontMutateFrozenCollections() {
    die(2);
  }
  var dontMutateMethodOverride = {
    value: dontMutateFrozenCollections
  };
  function isFrozen(obj) {
    if (obj === null || typeof obj !== "object")
      return true;
    return Object.isFrozen(obj);
  }
  var plugins = {};
  function getPlugin(pluginKey) {
    const plugin = plugins[pluginKey];
    if (!plugin) {
      die(0, pluginKey);
    }
    return plugin;
  }
  var currentScope;
  function getCurrentScope() {
    return currentScope;
  }
  function createScope(parent_, immer_) {
    return {
      drafts_: [],
      parent_,
      immer_,
      // Whenever the modified draft contains a draft from another scope, we
      // need to prevent auto-freezing so the unowned draft can be finalized.
      canAutoFreeze_: true,
      unfinalizedDrafts_: 0
    };
  }
  function usePatchesInScope(scope, patchListener) {
    if (patchListener) {
      getPlugin("Patches");
      scope.patches_ = [];
      scope.inversePatches_ = [];
      scope.patchListener_ = patchListener;
    }
  }
  function revokeScope(scope) {
    leaveScope(scope);
    scope.drafts_.forEach(revokeDraft);
    scope.drafts_ = null;
  }
  function leaveScope(scope) {
    if (scope === currentScope) {
      currentScope = scope.parent_;
    }
  }
  function enterScope(immer2) {
    return currentScope = createScope(currentScope, immer2);
  }
  function revokeDraft(draft) {
    const state2 = draft[DRAFT_STATE];
    if (state2.type_ === 0 || state2.type_ === 1)
      state2.revoke_();
    else
      state2.revoked_ = true;
  }
  function processResult(result, scope) {
    scope.unfinalizedDrafts_ = scope.drafts_.length;
    const baseDraft = scope.drafts_[0];
    const isReplaced = result !== void 0 && result !== baseDraft;
    if (isReplaced) {
      if (baseDraft[DRAFT_STATE].modified_) {
        revokeScope(scope);
        die(4);
      }
      if (isDraftable(result)) {
        result = finalize(scope, result);
        if (!scope.parent_)
          maybeFreeze(scope, result);
      }
      if (scope.patches_) {
        getPlugin("Patches").generateReplacementPatches_(
          baseDraft[DRAFT_STATE].base_,
          result,
          scope.patches_,
          scope.inversePatches_
        );
      }
    } else {
      result = finalize(scope, baseDraft, []);
    }
    revokeScope(scope);
    if (scope.patches_) {
      scope.patchListener_(scope.patches_, scope.inversePatches_);
    }
    return result !== NOTHING ? result : void 0;
  }
  function finalize(rootScope, value, path) {
    if (isFrozen(value))
      return value;
    const useStrictIteration = rootScope.immer_.shouldUseStrictIteration();
    const state2 = value[DRAFT_STATE];
    if (!state2) {
      each(
        value,
        (key, childValue) => finalizeProperty(rootScope, state2, value, key, childValue, path),
        useStrictIteration
      );
      return value;
    }
    if (state2.scope_ !== rootScope)
      return value;
    if (!state2.modified_) {
      maybeFreeze(rootScope, state2.base_, true);
      return state2.base_;
    }
    if (!state2.finalized_) {
      state2.finalized_ = true;
      state2.scope_.unfinalizedDrafts_--;
      const result = state2.copy_;
      let resultEach = result;
      let isSet2 = false;
      if (state2.type_ === 3) {
        resultEach = new Set(result);
        result.clear();
        isSet2 = true;
      }
      each(
        resultEach,
        (key, childValue) => finalizeProperty(
          rootScope,
          state2,
          result,
          key,
          childValue,
          path,
          isSet2
        ),
        useStrictIteration
      );
      maybeFreeze(rootScope, result, false);
      if (path && rootScope.patches_) {
        getPlugin("Patches").generatePatches_(
          state2,
          path,
          rootScope.patches_,
          rootScope.inversePatches_
        );
      }
    }
    return state2.copy_;
  }
  function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
    if (childValue == null) {
      return;
    }
    if (typeof childValue !== "object" && !targetIsSet) {
      return;
    }
    const childIsFrozen = isFrozen(childValue);
    if (childIsFrozen && !targetIsSet) {
      return;
    }
    if (childValue === targetObject)
      die(5);
    if (isDraft(childValue)) {
      const path = rootPath && parentState && parentState.type_ !== 3 && // Set objects are atomic since they have no keys.
      !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
      const res = finalize(rootScope, childValue, path);
      set(targetObject, prop, res);
      if (isDraft(res)) {
        rootScope.canAutoFreeze_ = false;
      } else
        return;
    } else if (targetIsSet) {
      targetObject.add(childValue);
    }
    if (isDraftable(childValue) && !childIsFrozen) {
      if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
        return;
      }
      if (parentState && parentState.base_ && parentState.base_[prop] === childValue && childIsFrozen) {
        return;
      }
      finalize(rootScope, childValue);
      if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && (isMap(targetObject) ? targetObject.has(prop) : Object.prototype.propertyIsEnumerable.call(targetObject, prop)))
        maybeFreeze(rootScope, childValue);
    }
  }
  function maybeFreeze(scope, value, deep = false) {
    if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
      freeze(value, deep);
    }
  }
  function createProxyProxy(base, parent) {
    const isArray = Array.isArray(base);
    const state2 = {
      type_: isArray ? 1 : 0,
      // Track which produce call this is associated with.
      scope_: parent ? parent.scope_ : getCurrentScope(),
      // True for both shallow and deep changes.
      modified_: false,
      // Used during finalization.
      finalized_: false,
      // Track which properties have been assigned (true) or deleted (false).
      assigned_: {},
      // The parent draft state.
      parent_: parent,
      // The base state.
      base_: base,
      // The base proxy.
      draft_: null,
      // set below
      // The base copy with any updated values.
      copy_: null,
      // Called by the `produce` function.
      revoke_: null,
      isManual_: false
    };
    let target = state2;
    let traps = objectTraps;
    if (isArray) {
      target = [state2];
      traps = arrayTraps;
    }
    const { revoke, proxy } = Proxy.revocable(target, traps);
    state2.draft_ = proxy;
    state2.revoke_ = revoke;
    return proxy;
  }
  var objectTraps = {
    get(state2, prop) {
      if (prop === DRAFT_STATE)
        return state2;
      const source = latest(state2);
      if (!has(source, prop)) {
        return readPropFromProto(state2, source, prop);
      }
      const value = source[prop];
      if (state2.finalized_ || !isDraftable(value)) {
        return value;
      }
      if (value === peek(state2.base_, prop)) {
        prepareCopy(state2);
        return state2.copy_[prop] = createProxy(value, state2);
      }
      return value;
    },
    has(state2, prop) {
      return prop in latest(state2);
    },
    ownKeys(state2) {
      return Reflect.ownKeys(latest(state2));
    },
    set(state2, prop, value) {
      const desc = getDescriptorFromProto(latest(state2), prop);
      if (desc?.set) {
        desc.set.call(state2.draft_, value);
        return true;
      }
      if (!state2.modified_) {
        const current2 = peek(latest(state2), prop);
        const currentState = current2?.[DRAFT_STATE];
        if (currentState && currentState.base_ === value) {
          state2.copy_[prop] = value;
          state2.assigned_[prop] = false;
          return true;
        }
        if (is(value, current2) && (value !== void 0 || has(state2.base_, prop)))
          return true;
        prepareCopy(state2);
        markChanged(state2);
      }
      if (state2.copy_[prop] === value && // special case: handle new props with value 'undefined'
      (value !== void 0 || prop in state2.copy_) || // special case: NaN
      Number.isNaN(value) && Number.isNaN(state2.copy_[prop]))
        return true;
      state2.copy_[prop] = value;
      state2.assigned_[prop] = true;
      return true;
    },
    deleteProperty(state2, prop) {
      if (peek(state2.base_, prop) !== void 0 || prop in state2.base_) {
        state2.assigned_[prop] = false;
        prepareCopy(state2);
        markChanged(state2);
      } else {
        delete state2.assigned_[prop];
      }
      if (state2.copy_) {
        delete state2.copy_[prop];
      }
      return true;
    },
    // Note: We never coerce `desc.value` into an Immer draft, because we can't make
    // the same guarantee in ES5 mode.
    getOwnPropertyDescriptor(state2, prop) {
      const owner = latest(state2);
      const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
      if (!desc)
        return desc;
      return {
        writable: true,
        configurable: state2.type_ !== 1 || prop !== "length",
        enumerable: desc.enumerable,
        value: owner[prop]
      };
    },
    defineProperty() {
      die(11);
    },
    getPrototypeOf(state2) {
      return getPrototypeOf(state2.base_);
    },
    setPrototypeOf() {
      die(12);
    }
  };
  var arrayTraps = {};
  each(objectTraps, (key, fn) => {
    arrayTraps[key] = function() {
      arguments[0] = arguments[0][0];
      return fn.apply(this, arguments);
    };
  });
  arrayTraps.deleteProperty = function(state2, prop) {
    if (isNaN(parseInt(prop)))
      die(13);
    return arrayTraps.set.call(this, state2, prop, void 0);
  };
  arrayTraps.set = function(state2, prop, value) {
    if (prop !== "length" && isNaN(parseInt(prop)))
      die(14);
    return objectTraps.set.call(this, state2[0], prop, value, state2[0]);
  };
  function peek(draft, prop) {
    const state2 = draft[DRAFT_STATE];
    const source = state2 ? latest(state2) : draft;
    return source[prop];
  }
  function readPropFromProto(state2, source, prop) {
    const desc = getDescriptorFromProto(source, prop);
    return desc ? `value` in desc ? desc.value : (
      // This is a very special case, if the prop is a getter defined by the
      // prototype, we should invoke it with the draft as context!
      desc.get?.call(state2.draft_)
    ) : void 0;
  }
  function getDescriptorFromProto(source, prop) {
    if (!(prop in source))
      return void 0;
    let proto = getPrototypeOf(source);
    while (proto) {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (desc)
        return desc;
      proto = getPrototypeOf(proto);
    }
    return void 0;
  }
  function markChanged(state2) {
    if (!state2.modified_) {
      state2.modified_ = true;
      if (state2.parent_) {
        markChanged(state2.parent_);
      }
    }
  }
  function prepareCopy(state2) {
    if (!state2.copy_) {
      state2.copy_ = shallowCopy(
        state2.base_,
        state2.scope_.immer_.useStrictShallowCopy_
      );
    }
  }
  var Immer2 = class {
    constructor(config) {
      this.autoFreeze_ = true;
      this.useStrictShallowCopy_ = false;
      this.useStrictIteration_ = true;
      this.produce = (base, recipe, patchListener) => {
        if (typeof base === "function" && typeof recipe !== "function") {
          const defaultBase = recipe;
          recipe = base;
          const self = this;
          return function curriedProduce(base2 = defaultBase, ...args) {
            return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
          };
        }
        if (typeof recipe !== "function")
          die(6);
        if (patchListener !== void 0 && typeof patchListener !== "function")
          die(7);
        let result;
        if (isDraftable(base)) {
          const scope = enterScope(this);
          const proxy = createProxy(base, void 0);
          let hasError = true;
          try {
            result = recipe(proxy);
            hasError = false;
          } finally {
            if (hasError)
              revokeScope(scope);
            else
              leaveScope(scope);
          }
          usePatchesInScope(scope, patchListener);
          return processResult(result, scope);
        } else if (!base || typeof base !== "object") {
          result = recipe(base);
          if (result === void 0)
            result = base;
          if (result === NOTHING)
            result = void 0;
          if (this.autoFreeze_)
            freeze(result, true);
          if (patchListener) {
            const p = [];
            const ip = [];
            getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
            patchListener(p, ip);
          }
          return result;
        } else
          die(1, base);
      };
      this.produceWithPatches = (base, recipe) => {
        if (typeof base === "function") {
          return (state2, ...args) => this.produceWithPatches(state2, (draft) => base(draft, ...args));
        }
        let patches, inversePatches;
        const result = this.produce(base, recipe, (p, ip) => {
          patches = p;
          inversePatches = ip;
        });
        return [result, patches, inversePatches];
      };
      if (typeof config?.autoFreeze === "boolean")
        this.setAutoFreeze(config.autoFreeze);
      if (typeof config?.useStrictShallowCopy === "boolean")
        this.setUseStrictShallowCopy(config.useStrictShallowCopy);
      if (typeof config?.useStrictIteration === "boolean")
        this.setUseStrictIteration(config.useStrictIteration);
    }
    createDraft(base) {
      if (!isDraftable(base))
        die(8);
      if (isDraft(base))
        base = current(base);
      const scope = enterScope(this);
      const proxy = createProxy(base, void 0);
      proxy[DRAFT_STATE].isManual_ = true;
      leaveScope(scope);
      return proxy;
    }
    finishDraft(draft, patchListener) {
      const state2 = draft && draft[DRAFT_STATE];
      if (!state2 || !state2.isManual_)
        die(9);
      const { scope_: scope } = state2;
      usePatchesInScope(scope, patchListener);
      return processResult(void 0, scope);
    }
    /**
     * Pass true to automatically freeze all copies created by Immer.
     *
     * By default, auto-freezing is enabled.
     */
    setAutoFreeze(value) {
      this.autoFreeze_ = value;
    }
    /**
     * Pass true to enable strict shallow copy.
     *
     * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
     */
    setUseStrictShallowCopy(value) {
      this.useStrictShallowCopy_ = value;
    }
    /**
     * Pass false to use faster iteration that skips non-enumerable properties
     * but still handles symbols for compatibility.
     *
     * By default, strict iteration is enabled (includes all own properties).
     */
    setUseStrictIteration(value) {
      this.useStrictIteration_ = value;
    }
    shouldUseStrictIteration() {
      return this.useStrictIteration_;
    }
    applyPatches(base, patches) {
      let i;
      for (i = patches.length - 1; i >= 0; i--) {
        const patch2 = patches[i];
        if (patch2.path.length === 0 && patch2.op === "replace") {
          base = patch2.value;
          break;
        }
      }
      if (i > -1) {
        patches = patches.slice(i + 1);
      }
      const applyPatchesImpl = getPlugin("Patches").applyPatches_;
      if (isDraft(base)) {
        return applyPatchesImpl(base, patches);
      }
      return this.produce(
        base,
        (draft) => applyPatchesImpl(draft, patches)
      );
    }
  };
  function createProxy(value, parent) {
    const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
    const scope = parent ? parent.scope_ : getCurrentScope();
    scope.drafts_.push(draft);
    return draft;
  }
  function current(value) {
    if (!isDraft(value))
      die(10, value);
    return currentImpl(value);
  }
  function currentImpl(value) {
    if (!isDraftable(value) || isFrozen(value))
      return value;
    const state2 = value[DRAFT_STATE];
    let copy;
    let strict = true;
    if (state2) {
      if (!state2.modified_)
        return state2.base_;
      state2.finalized_ = true;
      copy = shallowCopy(value, state2.scope_.immer_.useStrictShallowCopy_);
      strict = state2.scope_.immer_.shouldUseStrictIteration();
    } else {
      copy = shallowCopy(value, true);
    }
    each(
      copy,
      (key, childValue) => {
        set(copy, key, currentImpl(childValue));
      },
      strict
    );
    if (state2) {
      state2.finalized_ = false;
    }
    return copy;
  }
  var immer = new Immer2();
  var produce = immer.produce;

  // src/utils.js
  function uuid(a) {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : (
      // @ts-ignore
      ("10000000-1000-4000-8000" + -1e11).replace(/[018]/g, uuid)
    );
  }
  function shuffle(array) {
    array = array.slice();
    let m = array.length;
    let t;
    let i;
    while (m) {
      i = Math.floor(Math.random() * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }
  function range(size, startAt = 0) {
    return [...Array(size).keys()].map((i) => i + startAt);
  }
  function random(from, to) {
    const r = range(1 + to - from, from);
    if (from === to) return from;
    return shuffle(r)[0];
  }
  function clamp(x, lower, upper) {
    return Math.max(lower, Math.min(x, upper));
  }
  function pick(list) {
    return shuffle(Array.from(list))[0];
  }

  // src/game/monster.js
  function Monster(props = {
    currentHealth: 42,
    maxHealth: 42,
    intents: []
  }) {
    let randomIntents;
    if (typeof props.random === "number") {
      randomIntents = props.intents.map((intent) => {
        if (intent.damage) {
          const newDamage = shuffle(range(5, intent.damage - props.random))[0];
          intent.damage = newDamage;
        }
        return intent;
      });
    }
    return {
      name: props.name,
      sprite: props.sprite,
      currentHealth: props.hp || props.currentHealth,
      maxHealth: props.hp || props.maxHealth,
      block: props.block || 0,
      powers: props.powers || {},
      // A list of "actions" the monster will take each turn.
      // Example: [{damage: 6}, {block: 2}, {}, {weak: 2}]
      // ... meaning turn 1, deal 6 damage, turn 2 gain 2 block, turn 3 do nothing, turn 4 apply 2 weak
      intents: randomIntents || props.intents,
      // A counter to keep track of which intent to run next.
      nextIntent: 0
    };
  }

  // src/game/rooms.js
  function StartRoom() {
    return {
      type: "start"
    };
  }
  function CampfireRoom() {
    return {
      type: "campfire"
      // choices: ['rest', 'remove', 'upgrade'],
    };
  }
  function MonsterRoom(...monsters2) {
    return {
      type: "monster",
      monsters: monsters2
    };
  }

  // src/content/monster-rooms.js
  var monsters = {};
  var elites = {};
  var bosses = {};
  monsters["Lone Orc Scout"] = MonsterRoom(
    Monster({
      name: "Orc Scout",
      sprite: [0, 2],
      hp: random(8, 14),
      intents: [{ damage: 7 }, { damage: 11 }, { damage: 7 }, { block: 9 }],
      random: 2
    })
  );
  monsters["Orc Patrol"] = MonsterRoom(
    Monster({
      name: "Orc Archer",
      sprite: [0, 5],
      hp: random(8, 14),
      intents: [{ damage: 7 }, { damage: 11 }, { damage: 7 }, { block: 9 }],
      random: 2
    }),
    Monster({
      name: "Orc Scout",
      sprite: [0, 2],
      hp: random(8, 14),
      intents: [{ damage: 6 }, { damage: 11 }, { damage: 5 }, { block: 5 }],
      random: 1
    })
  );
  monsters["Orc Warrior"] = MonsterRoom(
    Monster({
      name: "Orc Warrior",
      sprite: [0, 0],
      hp: random(18, 20),
      intents: [{ damage: 7 }, { damage: 11 }, { damage: 7 }, { block: 9 }],
      random: 4
    })
  );
  monsters["Skeleton Warrior"] = MonsterRoom(
    Monster({
      name: "Skeleton Warrior",
      sprite: [4, 0],
      hp: random(33, 37),
      intents: [{ vulnerable: 1 }, { damage: 10 }, { damage: 6 }, {}, { weak: 1 }],
      random: 2
    })
  );
  monsters["Jaw Worm"] = MonsterRoom(
    Monster({
      name: "Jaw Worm",
      sprite: [6, 2],
      hp: random(40, 44),
      intents: [{ damage: 11 }, { damage: 7, block: 5 }, { block: 6 }]
    })
  );
  monsters["Slime and Shaman"] = MonsterRoom(
    Monster({
      name: "Small Slime",
      sprite: [2, 0],
      hp: random(13, 17),
      intents: [{ damage: 7 }, { block: 4, damage: 8 }, { damage: 6 }, {}, { block: 6 }],
      random: 2
    }),
    Monster({
      name: "Orc Shaman",
      sprite: [0, 1],
      hp: 29,
      intents: [{ damage: 9 }, { damage: 8 }, { weak: 1 }, { damage: 6 }, {}],
      random: 2
    })
  );
  monsters["Ghost and Berserker"] = MonsterRoom(
    Monster({
      name: "Ghost",
      sprite: [5, 3],
      hp: random(28, 32),
      intents: [{ weak: 1 }, { damage: 9 }, { damage: 6 }, {}, { weak: 1 }],
      random: 2
    }),
    Monster({
      name: "Orc Berserker",
      sprite: [0, 3],
      hp: random(50, 54),
      intents: [{ vulnerable: 1 }, { damage: 6 }, { damage: 9 }, { block: 10 }],
      random: 2
    })
  );
  monsters["Rat Pack"] = MonsterRoom(
    Monster({ name: "Giant Rat", sprite: [6, 11], hp: random(12, 15), random: 2, intents: [{ damage: 6 }] }),
    Monster({ name: "Giant Rat", sprite: [6, 11], hp: random(12, 15), random: 2, intents: [{ damage: 6 }] }),
    Monster({ name: "Giant Rat", sprite: [6, 11], hp: random(10, 16), random: 3, intents: [{ damage: 6 }] })
  );
  monsters["Troll Bruiser"] = MonsterRoom(
    Monster({
      name: "Troll",
      sprite: [1, 2],
      hp: 28,
      intents: [{ weak: 1 }, { block: 10, damage: 10 }, { damage: 21 }]
    })
  );
  elites["Death Knight"] = MonsterRoom(
    Monster({
      name: "Death Knight",
      sprite: [4, 3],
      hp: 46,
      intents: [{ damage: 12 }, { block: 6, damage: 11 }, { block: 5, damage: 16 }, {}, { block: 6 }]
    })
  );
  elites["Orc Warchief"] = MonsterRoom(
    Monster({
      name: "Orc Warchief",
      sprite: [0, 4],
      hp: 60,
      intents: [{ damage: 12 }, { damage: 11, weak: 1 }, { damage: 4, block: 6 }],
      random: 6
    })
  );
  elites["Two-Headed Ettin"] = MonsterRoom(
    Monster({ name: "Ettin", sprite: [1, 0], hp: 70, block: 12, intents: [{ block: 5 }, { damage: 16 }] })
  );
  elites["Dark Covenant"] = MonsterRoom(
    Monster({
      name: "Ghost Cultist",
      sprite: [5, 3],
      hp: random(39, 46),
      intents: [{ weak: 1 }, { damage: 10 }]
    }),
    Monster({
      name: "Hag",
      sprite: [5, 4],
      hp: random(39, 46),
      intents: [{ damage: 10 }, { weak: 1 }, { damage: 4 }]
    }),
    Monster({
      name: "Wraith",
      sprite: [5, 2],
      hp: random(39, 46),
      intents: [{ damage: 2 }, { damage: 10 }, { damage: 8 }]
    })
  );
  bosses["Ancient Dragon"] = MonsterRoom(
    Monster({
      name: "Ancient Dragon",
      sprite: [8, 2],
      hp: random(100, 140),
      intents: [{ damage: 16 }, { block: 6 }, { damage: 16 }, { damage: 7 }, { weak: 2 }],
      random: 5
    })
  );
  bosses["Slime King"] = MonsterRoom(
    Monster({
      name: "Slime King",
      sprite: [2, 1],
      hp: 62,
      intents: [
        { damage: 5 },
        { damage: 8 },
        { damage: 12 },
        { damage: 17 },
        { damage: 23 },
        { damage: 30 },
        { damage: 38 },
        { damage: 45 }
      ]
    })
  );

  // src/game/dungeon.js
  var defaultOptions = {
    width: 10,
    height: 6,
    minRooms: 2,
    maxRooms: 5,
    roomTypes: "MMMCE"
    // customPaths: '123'
  };
  function Dungeon(options) {
    options = Object.assign(defaultOptions, options);
    const graph = generateGraph(options);
    const paths = generatePaths(graph, options.customPaths);
    graph.forEach((floor, floorNumber) => {
      floor.forEach((node) => {
        if (node.type) {
          node.room = decideRoomType(node.type, floorNumber);
        }
      });
    });
    return {
      id: uuid(),
      graph,
      paths,
      x: 0,
      y: 0,
      pathTaken: [[0, 0]]
    };
  }
  function generateGraph(options) {
    options = Object.assign(defaultOptions, options || {});
    const { width, height, minRooms, maxRooms, roomTypes } = options;
    const graph = [];
    for (let floorNumber = 0; floorNumber < height; floorNumber++) {
      const floor = [];
      let desiredAmountOfRooms = random(minRooms, maxRooms);
      if (desiredAmountOfRooms > width) desiredAmountOfRooms = width;
      for (let i = 0; i < desiredAmountOfRooms; i++) {
        const nodeType = decideNodeType(roomTypes, floorNumber);
        floor.push(createMapNode(nodeType));
      }
      while (floor.length < width) {
        floor.push(createMapNode());
      }
      graph.push(shuffle(floor));
    }
    graph.unshift([createMapNode("start")]);
    graph.push([createMapNode("boss")]);
    return graph;
  }
  function generatePaths(graph, customPaths) {
    const paths = [];
    if (customPaths) {
      Array.from(customPaths).forEach((value) => {
        const path = findPath(graph, Number(value));
        paths.push(path);
      });
    } else {
      graph[1].forEach((_column, index) => {
        const path = findPath(graph, index);
        paths.push(path);
      });
    }
    return paths;
  }
  function validNode(node) {
    return node && Boolean(node.type);
  }
  function findPath(graph, preferredIndex, debug = false) {
    if (debug) console.groupCollapsed("finding path", preferredIndex);
    const path = [];
    let lastVisited = false;
    for (const [floorIndex, floor] of graph.entries()) {
      if (debug) console.group(`floor ${floorIndex}`);
      const nextFloor = graph[floorIndex + 1];
      if (!nextFloor) {
        if (debug) console.log("no next floor, stopping");
        if (debug) console.groupEnd();
        break;
      }
      const aIndex = lastVisited ? floor.indexOf(lastVisited) : 0;
      const moveFrom = [floorIndex, aIndex];
      if (debug) console.log("setting from", moveFrom);
      const bInfo = searchValidNode(nextFloor, preferredIndex, "forward") || searchValidNode(nextFloor, preferredIndex, "backward");
      if (!bInfo) throw Error("failed to find node to move to");
      const moveTo = [floorIndex + 1, bInfo.index];
      lastVisited = bInfo.node;
      const move2 = [moveFrom, moveTo];
      path.push(move2);
      if (debug) {
        console.log(`added move to path ${moveFrom} to ${moveTo}`);
        console.groupEnd();
      }
    }
    storePathOnGraph(graph, path);
    if (debug) console.groupEnd();
    return path;
  }
  function searchValidNode(floor, startX, direction) {
    const step = direction === "forward" ? 1 : -1;
    if (direction === "forward") {
      for (let i = startX; i >= 0 && i < floor.length; i += step) {
        const node = floor[i];
        if (validNode(node)) {
          return { node, index: i };
        }
      }
    } else {
      for (let i = startX; i >= 0; i += step) {
        const node = floor[i];
        if (validNode(node)) {
          return { node, index: i };
        }
      }
    }
    return null;
  }
  function storePathOnGraph(graph, path) {
    path.forEach((move2) => {
      const a = nodeFromMove(graph, move2[0]);
      const b = nodeFromMove(graph, move2[1]);
      if (!a.edges.includes(b.id)) {
        a.edges.push(b.id);
      }
    });
    return graph;
  }
  function nodeFromMove(graph, [floor, node]) {
    return graph[floor][node];
  }
  function createMapNode(type) {
    return {
      id: uuid(),
      type,
      room: void 0,
      edges: [],
      didVisit: false
    };
  }
  function decideNodeType(nodeTypes, floor) {
    if (floor < 2) return "M";
    if (floor < 3) return pick("MC");
    if (floor > 6) return pick("MMEEC");
    return pick(nodeTypes);
  }
  function decideRoomType(type, floor) {
    const pickRandomFromObj = (obj) => obj[shuffle(Object.keys(obj))[0]];
    if (floor === 0) return StartRoom();
    if (type === "C") return CampfireRoom();
    if (type === "M" && floor < 2) return pickRandomFromObj(monsters);
    if (type === "M") return pickRandomFromObj(monsters);
    if (type === "E") return pickRandomFromObj(elites);
    if (type === "boss") return pickRandomFromObj(bosses);
    throw new Error(`Could not match node type "${type}" with a dungeon room`);
  }

  // src/content/dungeons.js
  var createDefaultDungeon = () => {
    return Dungeon({
      width: 6,
      height: 10,
      minRooms: 3,
      maxRooms: 4,
      customPaths: "0235"
    });
  };

  // src/content/cards/_deadly-poison.js
  var deadly_poison_exports = {};
  __export(deadly_poison_exports, {
    default: () => deadly_poison_default,
    upgrade: () => upgrade
  });
  var deadly_poison_default = {
    name: "Deadly Poison",
    type: "attack",
    energy: 1,
    damage: 0,
    target: "enemy",
    powers: {
      poison: 5
    },
    description: "Apply 5 poison.",
    image: "6.jpg"
  };
  var upgrade = (card) => {
    return {
      ...card,
      powers: {
        poison: 7
      },
      description: "Apply 7 Poison"
    };
  };

  // src/content/cards/adrenaline.js
  var adrenaline_exports = {};
  __export(adrenaline_exports, {
    default: () => adrenaline_default,
    upgrade: () => upgrade2
  });
  var adrenaline_default = {
    name: "Adrenaline",
    type: "skill",
    energy: 0,
    damage: 0,
    target: "player",
    actions: [
      {
        type: "drawCards",
        parameter: {
          amount: 2
        }
      },
      {
        type: "addEnergyToPlayer",
        parameter: {
          amount: 1
        }
      }
    ],
    description: "Gain 1 Energy. Draw 2 cards. Exhaust.",
    image: "serpentine-dancer.jpg",
    exhaust: true
  };
  var upgrade2 = (card) => {
    const a = card.actions.find((action) => action.type === "addEnergyToPlayer");
    a.parameter.amount = 2;
    return {
      ...card,
      description: "Gain 2 Energy. Draw 2 cards. Exhaust."
    };
  };

  // src/content/cards/bash.js
  var bash_exports = {};
  __export(bash_exports, {
    default: () => bash_default,
    upgrade: () => upgrade3
  });
  var bash_default = {
    name: "Bash",
    type: "attack",
    energy: 2,
    damage: 8,
    target: "enemy",
    image: "apteryx-mantelli.jpg",
    powers: {
      vulnerable: 2
    },
    description: "Deal 8 damage. Apply 2 Vulnerable."
  };
  var upgrade3 = (card) => {
    return {
      ...card,
      damage: 10,
      description: "Deal 10 damage. Apply 3 Vulnerable",
      powers: {
        vulnerable: 3
      }
    };
  };

  // src/content/cards/bludgeon.js
  var bludgeon_exports = {};
  __export(bludgeon_exports, {
    default: () => bludgeon_default,
    upgrade: () => upgrade4
  });
  var bludgeon_default = {
    name: "Bludgeon",
    type: "attack",
    energy: 3,
    target: "enemy",
    damage: 24,
    description: "Deal 24 damage.",
    image: "alice-holds-the-white-king.jpg"
  };
  var upgrade4 = (card) => {
    return {
      ...card,
      damage: 36,
      description: "Deal 36 damage."
    };
  };

  // src/content/cards/body-slam.js
  var body_slam_exports = {};
  __export(body_slam_exports, {
    default: () => body_slam_default,
    upgrade: () => upgrade5
  });
  var body_slam_default = {
    name: "Body Slam",
    energy: 1,
    type: "attack",
    target: "enemy",
    description: "Deal damage equal to your Block.",
    image: "fallback.jpg",
    actions: [
      {
        type: "dealDamageEqualToBlock"
      }
    ]
  };
  var upgrade5 = (card) => {
    return {
      ...card,
      energy: 0
    };
  };

  // src/content/cards/clash.js
  var clash_exports = {};
  __export(clash_exports, {
    default: () => clash_default,
    upgrade: () => upgrade6
  });
  var clash_default = {
    name: "Clash",
    type: "attack",
    energy: 0,
    damage: 14,
    target: "enemy",
    conditions: [
      {
        type: "onlyType",
        cardType: "attack"
      }
    ],
    description: "Can only be played if every card in your hand is an Attack. Deal 14 damage.",
    image: "h-sperling-horrified.jpg"
  };
  var upgrade6 = (card) => ({
    ...card,
    damage: 17,
    description: "Can only be played if every card in your hand is an Attack. Deal 17 damage."
  });

  // src/content/cards/cleave.js
  var cleave_exports = {};
  __export(cleave_exports, {
    default: () => cleave_default,
    upgrade: () => upgrade7
  });
  var cleave_default = {
    name: "Cleave",
    type: "attack",
    energy: 1,
    damage: 8,
    target: "allEnemies",
    description: "Deal 8 damage to all enemies.",
    image: "vernal-equinox.jpg"
  };
  var upgrade7 = (card) => ({
    ...card,
    damage: 11,
    description: "Deal 11 damage to all enemies."
  });

  // src/content/cards/defend.js
  var defend_exports = {};
  __export(defend_exports, {
    default: () => defend_default,
    upgrade: () => upgrade8
  });
  var defend_default = {
    name: "Defend",
    type: "skill",
    energy: 1,
    target: "player",
    block: 5,
    description: "Gain 5 Block.",
    image: "angel-messenger.jpg"
  };
  var upgrade8 = (card) => {
    return {
      ...card,
      block: 8,
      description: "Gain 8 Block."
    };
  };

  // src/content/cards/flourish.js
  var flourish_exports = {};
  __export(flourish_exports, {
    default: () => flourish_default,
    upgrade: () => upgrade9
  });
  var flourish = {
    name: "Flourish",
    type: "skill",
    energy: 2,
    target: "player",
    description: "Gain 5 Regen. Can only be played if your health is below 50%.",
    image: "5.jpg",
    powers: {
      regen: 5
    },
    conditions: [
      {
        type: "healthPercentageBelow",
        percentage: 50
      }
    ]
  };
  var flourish_default = flourish;
  var upgrade9 = (card) => {
    const a = card.conditions.find((action) => action.type === "healthPercentageBelow");
    a.percentage = 75;
    return {
      ...card,
      description: "Gain 5 Regen. Can only be played if your health is below 75%."
    };
  };

  // src/content/cards/intimidate.js
  var intimidate_exports = {};
  __export(intimidate_exports, {
    default: () => intimidate_default,
    upgrade: () => upgrade10
  });
  var intimidate_default = {
    name: "Intimidate",
    type: "skill",
    energy: 0,
    damage: 0,
    target: "allEnemies",
    powers: {
      weak: 1
    },
    description: "Apply 1 Weak to ALL enemies. Exhaust.",
    image: "poured-millions-of-bubbles.jpg",
    exhaust: true
  };
  var upgrade10 = (card) => {
    card.powers.weak = 2;
    return {
      ...card,
      description: "Apply 2 Weak to ALL enemies. Exhaust."
    };
  };

  // src/content/cards/iron-wave.js
  var iron_wave_exports = {};
  __export(iron_wave_exports, {
    default: () => iron_wave_default,
    upgrade: () => upgrade11
  });
  var iron_wave_default = {
    name: "Iron Wave",
    type: "attack",
    energy: 1,
    damage: 5,
    block: 5,
    target: "enemy",
    description: "Deal 5 damage. Gain 5 Block.",
    image: "henry-stares-back.jpg"
  };
  var upgrade11 = (card) => ({
    ...card,
    damage: 7,
    block: 7,
    description: "Deal 7 damage. Gain 7 Block."
  });

  // src/content/cards/mask-of-the-faceless.js
  var mask_of_the_faceless_exports = {};
  __export(mask_of_the_faceless_exports, {
    default: () => mask_of_the_faceless_default,
    upgrade: () => upgrade12
  });
  var mask_of_the_faceless_default = {
    name: "Mask of the Faceless",
    type: "skill",
    energy: 0,
    target: "player",
    description: "Gain 1 Energy",
    image: "mask-of-the-faceless.png",
    damage: 0,
    actions: [
      {
        type: "addEnergyToPlayer",
        parameter: {
          amount: 1
        }
      }
    ]
  };
  var upgrade12 = (card) => {
    return {
      ...card,
      block: 5,
      description: "Gain 1 Energy and 5 Block."
    };
  };

  // src/content/cards/pommel-strike.js
  var pommel_strike_exports = {};
  __export(pommel_strike_exports, {
    default: () => pommel_strike_default,
    upgrade: () => upgrade13
  });
  var pommel_strike_default = {
    name: "Pommel Strike",
    type: "attack",
    energy: 1,
    target: "enemy",
    description: "Deal 9 damage. Draw 1 card.",
    image: "8.jpg",
    damage: 9,
    actions: [
      {
        type: "drawCards",
        parameter: {
          amount: 1
        }
      }
    ]
  };
  var upgrade13 = (card) => {
    const a = card.actions.find((action) => action.type === "drawCards");
    a.parameter.amount = 2;
    return {
      ...card,
      damage: 10,
      description: "Deal 10 damage. Draw 2 cards"
    };
  };

  // src/content/cards/ritual-rain.js
  var ritual_rain_exports = {};
  __export(ritual_rain_exports, {
    default: () => ritual_rain_default,
    upgrade: () => upgrade14
  });
  var ritual_rain_default = {
    name: "Ritual Rain",
    type: "skill",
    energy: 2,
    target: "player",
    description: "Dispel your Weaknesses and Vulnerabilities.",
    image: "ritual-rain.png",
    damage: 0,
    actions: [
      {
        type: "removePlayerDebuffs"
      }
    ]
  };
  var upgrade14 = (card) => {
    return {
      ...card,
      description: "Dispel your Weaknesses and Vulnerabilities. Gain 10 Block.",
      block: 10
    };
  };

  // src/content/cards/soul-drain.js
  var soul_drain_exports = {};
  __export(soul_drain_exports, {
    default: () => soul_drain_default,
    upgrade: () => upgrade15
  });
  var soul_drain_default = {
    name: "Soul Drain",
    type: "attack",
    energy: 1,
    target: "allEnemies",
    description: "Apply 3 Weak and Vulnerability to ALL enemies. Drains 3 Health from you.",
    image: "soul-drain.png",
    damage: 0,
    powers: {
      weak: 3,
      vulnerable: 3
    },
    actions: [
      {
        type: "removeHealth",
        parameter: {
          amount: 3,
          target: "player"
        }
      }
    ]
  };
  var upgrade15 = (card) => {
    const a = card.actions.find((action) => action.type === "removeHealth");
    a.parameter.amount = 4;
    return {
      ...card,
      powers: {
        weak: 4,
        vulnerable: 4
      },
      description: "Apply 4 Weak and Vulnerability to ALL enemies. Drains 3 Health from you."
    };
  };

  // src/content/cards/strike.js
  var strike_exports = {};
  __export(strike_exports, {
    default: () => strike_default,
    upgrade: () => upgrade16
  });
  var strike_default = {
    name: "Strike",
    type: "attack",
    energy: 1,
    target: "enemy",
    damage: 6,
    description: "Deal 6 damage.",
    image: "the-angel-of-death.jpg"
  };
  var upgrade16 = (card) => {
    return {
      ...card,
      damage: 9,
      description: "Deal 9 damage."
    };
  };

  // src/content/cards/succube.js
  var succube_exports = {};
  __export(succube_exports, {
    default: () => succube_default,
    upgrade: () => upgrade17
  });
  var succube_default = {
    name: "Succube",
    type: "attack",
    energy: 3,
    target: "allEnemies",
    description: "Deal 2 damage to ALL enemies and suck it into life.",
    image: "succube.png",
    damage: 2,
    actions: [
      {
        type: "addRegenEqualToAllDamage"
      }
    ]
  };
  var upgrade17 = (card) => ({
    ...card,
    damage: 3,
    name: "High Succube+",
    description: "Deal 3 damage to ALL enemies and suck it into life."
  });

  // src/content/cards/sucker-punch.js
  var sucker_punch_exports = {};
  __export(sucker_punch_exports, {
    default: () => sucker_punch_default,
    upgrade: () => upgrade18
  });
  var sucker_punch_default = {
    name: "Sucker Punch",
    type: "attack",
    energy: 1,
    damage: 7,
    target: "enemy",
    powers: {
      weak: 1
    },
    description: "Deal 7 damage. Apply 1 Weak.",
    image: "manicule.jpg"
  };
  var upgrade18 = (card) => ({
    ...card,
    damage: 8,
    powers: {
      weak: 2
    },
    description: "Deal 8 damage. Apply 2 Weak."
  });

  // src/content/cards/summer-of-sam.js
  var summer_of_sam_exports = {};
  __export(summer_of_sam_exports, {
    default: () => summer_of_sam_default,
    upgrade: () => upgrade19
  });
  var summer_of_sam_default = {
    name: "Summer of Sam",
    type: "skill",
    energy: 1,
    target: "player",
    description: "Gain 1 Health. If your health is below 50% draw 2 cards.",
    image: "bare-feet-of-god.jpg",
    actions: [
      {
        type: "addHealth",
        parameter: {
          amount: 1
        }
      },
      {
        type: "drawCards",
        parameter: {
          amount: 2
        },
        conditions: [
          {
            type: "healthPercentageBelow",
            percentage: 50
          }
        ]
      }
    ]
  };
  var upgrade19 = (card) => {
    const a = card.actions.find((action) => action.type === "addHealth");
    a.parameter.amount = 2;
    return {
      ...card,
      description: "Gain 2 Health. If your health is below 50% draw 2 cards."
    };
  };

  // src/content/cards/terror.js
  var terror_exports = {};
  __export(terror_exports, {
    default: () => terror_default,
    upgrade: () => upgrade20
  });
  var terror_default = {
    name: "Terror",
    type: "skill",
    energy: 1,
    damage: 0,
    target: "enemy",
    powers: {
      vulnerable: 99
    },
    description: "Apply 99 Vulnerable. Exhaust.",
    image: "2.jpg",
    exhaust: true
  };
  var upgrade20 = (card) => {
    return {
      ...card,
      energy: 0
    };
  };

  // src/content/cards/thunderclap.js
  var thunderclap_exports = {};
  __export(thunderclap_exports, {
    default: () => thunderclap_default,
    upgrade: () => upgrade21
  });
  var thunderclap_default = {
    name: "Thunderclap",
    type: "attack",
    energy: 1,
    damage: 4,
    target: "allEnemies",
    powers: {
      vulnerable: 1
    },
    description: "Deal 4 damage. Apply 1 Vulnerable to ALL enemies.",
    image: "4.jpg"
  };
  var upgrade21 = (card) => {
    return {
      ...card,
      damage: 6,
      description: "Deal 6 damage. Apply 1 Vulnerable to ALL enemies."
    };
  };

  // src/content/cards/voodoo-gift.js
  var voodoo_gift_exports = {};
  __export(voodoo_gift_exports, {
    default: () => voodoo_gift_default,
    upgrade: () => upgrade22
  });
  var voodoo_gift_default = {
    name: "Voodoo Gift",
    energy: 0,
    type: "attack",
    target: "enemy",
    description: "Deal damage equal to target's Vulnerable and Weak and remove the debuffs.",
    image: "voodoo-education.png",
    actions: [
      {
        type: "dealDamageEqualToWeak"
      },
      {
        type: "dealDamageEqualToVulnerable"
      },
      {
        type: "setPower",
        parameter: {
          power: "weak",
          amount: 0
        }
      },
      {
        type: "setPower",
        parameter: {
          power: "vulnerable",
          amount: 0
        }
      }
    ]
  };
  var upgrade22 = (card) => {
    card.actions = [
      {
        type: "dealDamageEqualToWeak"
      },
      {
        type: "dealDamageEqualToVulnerable"
      }
    ];
    return {
      ...card,
      damage: 9,
      description: `${card.description} but without resets.`
    };
  };

  // src/content/cards.js
  var modules = [deadly_poison_exports, adrenaline_exports, bash_exports, bludgeon_exports, body_slam_exports, clash_exports, cleave_exports, defend_exports, flourish_exports, intimidate_exports, iron_wave_exports, mask_of_the_faceless_exports, pommel_strike_exports, ritual_rain_exports, soul_drain_exports, strike_exports, succube_exports, sucker_punch_exports, summer_of_sam_exports, terror_exports, thunderclap_exports, voodoo_gift_exports];
  var cards = modules.map((module) => module.default);
  var cardUpgrades = Object.fromEntries(modules.map((module) => [module.default.name, module.upgrade]));

  // src/game/cards.js
  var CardTypes = {
    attack: "attack",
    skill: "skill",
    power: "power",
    status: "status",
    curse: "curse"
  };
  var CardTargets = {
    player: "player",
    enemy: "enemy",
    allEnemies: "allEnemies"
  };
  var Card = class {
    /** @param {CARD} props */
    constructor(props) {
      this.id = uuid();
      this.name = props.name;
      this.type = CardTypes[props.type];
      this.energy = props.energy;
      this.target = CardTargets[props.target];
      this.damage = props.damage || 0;
      this.block = props.block || 0;
      this.powers = props.powers;
      this.description = props.description;
      this.conditions = props.conditions;
      this.actions = props.actions;
      this.image = props.image;
      this.upgraded = props.upgraded || false;
      this.exhaust = props.exhaust || false;
    }
  };
  function createCard(name, shouldUpgrade) {
    if (name.includes("+")) {
      const baseName = upgradeNameMap[name] || name.replace("+", "");
      return createCard(baseName, true);
    }
    let card = cards.find((card2) => card2.name === name);
    if (!card) throw new Error(`Card not found: ${name}`);
    if (shouldUpgrade) {
      const upgradeFn = cardUpgrades[name];
      card = upgradeFn(card);
      card.upgraded = true;
      if (!card.name.includes("+")) card.name += "+";
    } else {
      card = { ...card };
    }
    return new Card(card);
  }
  var upgradeNameMap = {};
  cards.forEach((card) => {
    const upgradeFn = cardUpgrades[card.name];
    if (upgradeFn) {
      const upgradedCard = upgradeFn(card);
      if (upgradedCard.name !== `${card.name}+`) {
        upgradeNameMap[upgradedCard.name] = card.name;
      }
    }
  });

  // src/game/utils-state.js
  function getPlayerHealthPercentage(state2) {
    return state2.player.currentHealth / state2.player.maxHealth * 100;
  }
  function getCurrentNode(dungeon) {
    return dungeon.graph[dungeon.y][dungeon.x];
  }
  function getCurrRoom(state2) {
    const node = getCurrentNode(state2.dungeon);
    if (!node.room) throw new Error("This node has no room");
    return node.room;
  }
  function getRoomTargets(state2, targetQuery) {
    if (!targetQuery || typeof targetQuery !== "string") throw new Error("Bad query string");
    if (targetQuery.includes(CardTargets.player)) return [state2.player];
    if (targetQuery === CardTargets.allEnemies) return getCurrRoom(state2).monsters;
    if (targetQuery.startsWith(CardTargets.enemy)) {
      const index = Number(targetQuery.split("enemy")[1]);
      const monster = getCurrRoom(state2).monsters[index];
      if (monster) return [monster];
    }
    throw new Error(`Could not find target "${targetQuery}" on ${state2.dungeon.y}/${state2.dungeon.x}`);
  }
  function isRoomCompleted(room) {
    if (room.type === "monster") {
      const deadMonsters = room.monsters.filter((m) => m.currentHealth < 1);
      return deadMonsters.length === room.monsters.length;
    } else if (room.type === "campfire") {
      return room.choice === "rest" || Boolean(room.reward);
    } else if (room.type === "start") {
      return true;
    }
    throw new Error(`Could not check if room has been completed: "${room.type}"`);
  }
  function isCurrRoomCompleted(state2) {
    const room = getCurrRoom(state2);
    return isRoomCompleted(room);
  }
  function isDungeonCompleted(state2) {
    const lastFloor = state2.dungeon.graph[state2.dungeon.graph.length - 1];
    const bossNode = lastFloor[0];
    return bossNode.room && isRoomCompleted(bossNode.room);
  }

  // src/game/conditions.js
  function onlyType(state2, condition) {
    return state2.hand.every((card) => card.type === condition.cardType);
  }
  function healthPercentageAbove(state2, condition) {
    return getPlayerHealthPercentage(state2) > condition.percentage;
  }
  function healthPercentageBelow(state2, condition) {
    return getPlayerHealthPercentage(state2) < condition.percentage;
  }
  function conditionsAreValid(state2, conditions) {
    const isValid = true;
    if (conditions) {
      return conditions.every((condition) => {
        const cond = allConditions[condition.type];
        return cond(state2, condition);
      });
    }
    return isValid;
  }
  var allConditions = {
    onlyType,
    healthPercentageAbove,
    healthPercentageBelow
  };

  // src/game/powers.js
  var Power = class {
    /**
     * @param {POWER} power - The base power to create a class from
     */
    constructor(power) {
      const { name, description, type, target, use } = power;
      this.name = name;
      this.description = description;
      this.type = type;
      this.target = target;
      this.use = use;
    }
  };
  var regen = new Power({
    type: "buff",
    name: "Regen",
    description: "Heals an amount of health points equal to Regen stacks",
    target: "player",
    use: (stacks) => stacks
  });
  var poison = new Power({
    type: "debuff",
    name: "Poison",
    description: "Hurts equal to poison stacks (todo: make poison reduce at start of turn, not end)",
    use: (stacks) => stacks
  });
  var vulnerable = new Power({
    type: "debuff",
    name: "Vulnerable",
    description: "Takes 50% more damage while Vulnerable",
    use: (dmg) => Math.floor(dmg * 1.5)
  });
  var weak = new Power({
    type: "debuff",
    name: "Weak",
    description: "Weakened targets deal 25% less damage",
    use: (dmg) => Math.floor(dmg * 0.75)
  });
  var strength = new Power({
    type: "buff",
    name: "strength",
    description: "Strengthened targets deal +x damage",
    //make x be current strength level
    use: (stacks) => stacks
  });
  var powers_default = { regen, vulnerable, weak, strength };

  // src/game/actions.js
  function createNewState() {
    return {
      turn: 1,
      deck: [],
      drawPile: [],
      hand: [],
      discardPile: [],
      exhaustPile: [],
      player: {
        maxEnergy: 3,
        currentEnergy: 3,
        maxHealth: 72,
        currentHealth: 72,
        block: 0,
        powers: {}
      },
      dungeon: void 0,
      createdAt: Date.now(),
      endedAt: void 0,
      won: false,
      didCheat: false
    };
  }
  function setDungeon(state2, dungeon) {
    if (!dungeon) dungeon = createDefaultDungeon();
    state2.dungeon = dungeon;
    return state2;
  }
  function addStarterDeck(state2) {
    const deck = [
      createCard("Defend"),
      createCard("Defend"),
      createCard("Defend"),
      createCard("Defend"),
      createCard("Strike"),
      createCard("Strike"),
      createCard("Strike"),
      createCard("Strike"),
      createCard("Strike"),
      createCard("Bash")
    ];
    return produce(state2, (draft) => {
      draft.deck = deck;
      draft.drawPile = shuffle(deck);
    });
  }
  function drawCards(state2, options) {
    const amount = options?.amount ? options.amount : 5;
    return produce(state2, (draft) => {
      if (state2.drawPile.length < amount) {
        draft.drawPile = state2.drawPile.concat(state2.discardPile);
        draft.drawPile = shuffle(draft.drawPile);
        draft.discardPile = [];
      }
      const newCards = draft.drawPile.slice(0, amount);
      draft.hand = draft.hand.concat(newCards);
      for (let i = 0; i < amount; i++) {
        draft.drawPile.shift();
      }
    });
  }
  function addCardToHand(state2, { card }) {
    return produce(state2, (draft) => {
      draft.hand.push(card);
    });
  }
  function discardCard(state2, { card }) {
    return produce(state2, (draft) => {
      draft.hand = state2.hand.filter((c) => c.id !== card.id);
      if (card.exhaust) {
        draft.exhaustPile.push(card);
      } else {
        draft.discardPile.push(card);
      }
    });
  }
  function discardHand(state2) {
    return produce(state2, (draft) => {
      draft.hand.forEach((card) => {
        draft.discardPile.push(card);
      });
      draft.hand = [];
    });
  }
  function removeCard(state2, { card }) {
    return produce(state2, (draft) => {
      draft.deck = state2.deck.filter((c) => c.id !== card.id);
    });
  }
  function upgradeCard(state2, { card }) {
    return produce(state2, (draft) => {
      const upgradedCard = createCard(card.name, true);
      const piles = [draft.deck, draft.hand, draft.drawPile, draft.discardPile, draft.exhaustPile];
      piles.forEach((pile) => {
        const index = pile.findIndex((c) => c.id === card.id);
        if (index !== -1) pile[index] = upgradedCard;
      });
    });
  }
  function playCard(state2, { card, target }) {
    if (!card) throw new Error("No card to play");
    if (!target) target = card.target;
    if (typeof target !== "string") throw new Error(`Wrong target to play card: ${target},${card.target}`);
    if (target === "enemy") throw new Error('Wrong target, did you mean "enemy0" or "allEnemies"?');
    if (state2.player.currentEnergy < card.energy) throw new Error("Not enough energy to play card");
    let newState = discardCard(state2, { card });
    newState = produce(newState, (draft) => {
      draft.player.currentEnergy = newState.player.currentEnergy - card.energy;
      if (card.block) {
        draft.player.block = newState.player.block + card.block;
      }
    });
    if (card.type === "attack" || card.damage) {
      const newTarget = card.target === CardTargets.allEnemies ? card.target : target;
      let amount = card.damage;
      if (newState.player.powers.strength) {
        amount = amount + powers_default.strength.use(newState.player.powers.strength);
      }
      if (newState.player.powers.weak) {
        amount = powers_default.weak.use(amount);
      }
      newState = removeHealth(newState, { target: newTarget, amount });
    }
    if (card.powers) newState = applyCardPowers(newState, { target, card });
    newState = useCardActions(newState, { target, card });
    return newState;
  }
  function useCardActions(state2, { target, card }) {
    if (!card.actions) return state2;
    let nextState = state2;
    card.actions.forEach((action) => {
      if (action.conditions && !conditionsAreValid(state2, action.conditions)) {
        return;
      }
      if (!action.parameter) action.parameter = {};
      action.parameter.target = target;
      nextState = allActions[action.type](nextState, {
        ...action.parameter,
        card
      });
    });
    return nextState;
  }
  function addHealth(state2, { target, amount }) {
    return produce(state2, (draft) => {
      const targets = getRoomTargets(draft, target);
      targets.forEach((t) => {
        t.currentHealth = clamp(t.currentHealth + amount, 0, t.maxHealth);
      });
    });
  }
  function addRegenEqualToAllDamage(state2, { card }) {
    if (!card) throw new Error("missing card!");
    return produce(state2, (draft) => {
      const room = getCurrRoom(state2);
      const aliveMonsters = room.monsters.filter((monster) => monster.currentHealth > 0);
      const { regen: regen2 = 0 } = state2.player.powers;
      const totalDamage = aliveMonsters.length * card.damage;
      draft.player.powers.regen = totalDamage + regen2;
    });
  }
  var removePlayerDebuffs = (state2) => {
    return produce(state2, (draft) => {
      draft.player.powers.weak = 0;
      draft.player.powers.vulnerable = 0;
    });
  };
  function addEnergyToPlayer(state2, props) {
    const amount = props?.amount ? props.amount : 1;
    return produce(state2, (draft) => {
      draft.player.currentEnergy = draft.player.currentEnergy + amount;
    });
  }
  var removeHealth = (state2, { target, amount = 0 }) => {
    return produce(state2, (draft) => {
      getRoomTargets(draft, target).forEach((t) => {
        if (t.powers.vulnerable) amount = powers_default.vulnerable.use(amount);
        const amountAfterBlock = t.block - amount;
        if (amountAfterBlock < 0) {
          t.block = 0;
          t.currentHealth = t.currentHealth + amountAfterBlock;
        } else {
          t.block = amountAfterBlock;
        }
        if (target === "player" && t.currentHealth < 1) {
          draft.endedAt = Date.now();
        }
      });
    });
  };
  var setHealth = (state2, { target, amount }) => {
    return produce(state2, (draft) => {
      getRoomTargets(draft, target).forEach((t) => {
        t.currentHealth = amount;
      });
    });
  };
  function applyCardPowers(state2, { card, target }) {
    return produce(state2, (draft) => {
      Object.entries(card.powers).forEach(([name, stacks]) => {
        if (card.target === CardTargets.player) {
          draft.player.powers[name] = (draft.player.powers[name] || 0) + stacks;
        } else if (card.target === CardTargets.allEnemies) {
          draft.dungeon.graph[draft.dungeon.y][draft.dungeon.x].room.monsters.forEach((monster) => {
            if (monster.currentHealth < 1) return;
            monster.powers[name] = (monster.powers[name] || 0) + stacks;
          });
        } else if (target) {
          const index = target.split("enemy")[1];
          const monster = draft.dungeon.graph[draft.dungeon.y][draft.dungeon.x].room.monsters[index];
          if (monster.currentHealth < 1) return;
          monster.powers[name] = (monster.powers[name] || 0) + stacks;
        }
      });
    });
  }
  function _decreasePowers(powers) {
    Object.entries(powers).forEach(([name, stacks]) => {
      if (stacks > 0) powers[name] = stacks - 1;
    });
  }
  function decreasePlayerPowerStacks(state2) {
    return produce(state2, (draft) => {
      _decreasePowers(draft.player.powers);
    });
  }
  function decreaseMonsterPowerStacks(state2) {
    return produce(state2, (draft) => {
      getCurrRoom(draft).monsters.forEach((monster) => {
        _decreasePowers(monster.powers);
      });
    });
  }
  function endTurn(state2) {
    let newState = discardHand(state2);
    if (state2.player.powers.regen) {
      newState = produce(newState, (draft) => {
        const amount = powers_default.regen.use(newState.player.powers.regen);
        let newHealth;
        if (newState.player.currentHealth + amount > newState.player.maxHealth) {
          newHealth = newState.player.maxHealth;
        } else {
          newHealth = addHealth(newState, { target: "player", amount }).player.currentHealth;
        }
        draft.player.currentHealth = newHealth;
      });
    }
    newState = playMonsterActions(newState);
    newState = decreasePlayerPowerStacks(newState);
    newState = decreaseMonsterPowerStacks(newState);
    const isDead = newState.player.currentHealth < 0;
    const didWin = isDungeonCompleted(newState);
    const gameOver = isDead || didWin;
    newState = produce(newState, (draft) => {
      if (didWin) draft.won = true;
      if (gameOver) {
        draft.endedAt = Date.now();
      }
    });
    if (!gameOver) newState = newTurn(newState);
    return newState;
  }
  function newTurn(state2) {
    const newState = drawCards(state2);
    return produce(newState, (draft) => {
      draft.turn++;
      draft.player.currentEnergy = 3;
      draft.player.block = 0;
    });
  }
  function endEncounter(state2) {
    const nextState = produce(state2, (draft) => {
      draft.hand = [];
      draft.discardPile = [];
      draft.exhaustPile = [];
      draft.drawPile = shuffle(draft.deck);
    });
    return drawCards(nextState);
  }
  function playMonsterActions(state2) {
    const room = getCurrRoom(state2);
    if (!room.monsters) return state2;
    let nextState = state2;
    room.monsters.forEach((_monster, index) => {
      nextState = takeMonsterTurn(nextState, index);
    });
    return nextState;
  }
  function takeMonsterTurn(state2, monsterIndex) {
    return produce(state2, (draft) => {
      const room = getCurrRoom(draft);
      const monster = room.monsters[monsterIndex];
      monster.block = 0;
      if (monster.currentHealth < 1) return;
      const intent = monster.intents[monster.nextIntent || 0];
      if (!intent) return;
      if (monster.nextIntent === monster.intents.length - 1) {
        monster.nextIntent = 0;
      } else {
        monster.nextIntent++;
      }
      if (intent.block) {
        monster.block = monster.block + intent.block;
      }
      if (intent.damage) {
        let amount = intent.damage;
        if (monster.powers.weak) amount = powers_default.weak.use(amount);
        const updatedPlayer = removeHealth(draft, {
          target: "player",
          amount
        }).player;
        draft.player.block = updatedPlayer.block;
        draft.player.currentHealth = updatedPlayer.currentHealth;
        if (updatedPlayer.currentHealth < 1) {
          draft.endedAt = Date.now();
        }
      }
      if (intent.vulnerable) {
        draft.player.powers.vulnerable = (draft.player.powers.vulnerable || 0) + intent.vulnerable + 1;
      }
      if (intent.weak) {
        draft.player.powers.weak = (draft.player.powers.weak || 0) + intent.weak + 1;
      }
    });
  }
  function addCardToDeck(state2, { card }) {
    return produce(state2, (draft) => {
      draft.deck.push(card);
    });
  }
  function move(state2, { move: move2 }) {
    const nextState = endEncounter(state2);
    return produce(nextState, (draft) => {
      draft.player.powers = {};
      draft.player.currentEnergy = 3;
      draft.player.block = 0;
      draft.dungeon.graph[move2.y][move2.x].didVisit = true;
      draft.dungeon.pathTaken.push([move2.x, move2.y]);
      draft.dungeon.x = move2.x;
      draft.dungeon.y = move2.y;
    });
  }
  function dealDamageEqualToBlock(state2, { target }) {
    if (state2.player.block) {
      const block = state2.player.block;
      return removeHealth(state2, { target, amount: block });
    }
  }
  function dealDamageEqualToVulnerable(state2, { target }) {
    return produce(state2, (draft) => {
      getRoomTargets(draft, target).forEach((t) => {
        if (t.powers.vulnerable) {
          const amount = t.currentHealth - t.powers.vulnerable;
          t.currentHealth = amount;
        }
      });
      return draft;
    });
  }
  function dealDamageEqualToWeak(state2, { target }) {
    return produce(state2, (draft) => {
      getRoomTargets(draft, target).forEach((t) => {
        if (t.powers.weak) {
          const amount = t.currentHealth - t.powers.weak;
          t.currentHealth = amount;
        }
      });
      return draft;
    });
  }
  function setPower(state2, { target, power, amount }) {
    return produce(state2, (draft) => {
      getRoomTargets(draft, target).forEach((target2) => {
        target2.powers[power] = amount;
      });
    });
  }
  function makeCampfireChoice(state2, { choice, reward }) {
    return produce(state2, (draft) => {
      const room = getCurrRoom(draft);
      room.choice = choice;
      room.reward = reward;
    });
  }
  function iddqd(state2) {
    console.log("iddqd");
    return produce(state2, (draft) => {
      draft.dungeon.graph.forEach((floor) => {
        floor.forEach((node) => {
          if (!node.room?.monsters) return;
          node.room.monsters.forEach((monster) => {
            monster.currentHealth = 1;
          });
        });
      });
    });
  }
  function setDeck(state2, { cardNames }) {
    const deck = cardNames.map((name) => createCard(name));
    return produce(state2, (draft) => {
      draft.deck = deck;
      draft.drawPile = shuffle(deck);
    });
  }
  function setDidCheat(state2) {
    return produce(state2, (draft) => {
      draft.didCheat = true;
    });
  }
  var allActions = {
    addCardToDeck,
    addCardToHand,
    addEnergyToPlayer,
    addHealth,
    addRegenEqualToAllDamage,
    addStarterDeck,
    applyCardPowers,
    createNewState,
    dealDamageEqualToBlock,
    dealDamageEqualToVulnerable,
    dealDamageEqualToWeak,
    discardCard,
    discardHand,
    drawCards,
    endTurn,
    iddqd,
    makeCampfireChoice,
    move,
    playCard,
    removeCard,
    removeHealth,
    removePlayerDebuffs,
    setDeck,
    setDidCheat,
    setDungeon,
    setHealth,
    setPower,
    takeMonsterTurn,
    upgradeCard,
    endEncounter
  };
  var actions_default = allActions;

  // src/pantry.js
  var food = (id, name, image, group, cost, text, effects2 = {}) => ({
    id,
    name,
    image,
    group,
    cost,
    text,
    ...effects2
  });
  var groups = {
    staple: "\u4E3B\u98DF",
    protein: "\u86CB\u767D\u98DF\u6750",
    plant: "\u852C\u679C",
    water: "\u996E\u6C34",
    treat: "\u751C\u70B9",
    dish: "\u83DC\u80B4"
  };
  var pantry = [
    food("bread", "\u9762\u5305", "bread", "staple", 1, "\u9020\u6210 6 \u70B9\u4F24\u5BB3\u3002\u4E0B\u4E00\u56DE\u5408\u591A\u62BD 1 \u5F20\u3002", { damage: 6, prep: 1 }),
    food("potato", "\u70E4\u9A6C\u94C3\u85AF", "baked_potato", "staple", 1, "\u83B7\u5F97 6 \u70B9\u62A4\u76FE\u3002\u4E0B\u4E00\u56DE\u5408\u591A\u62BD 1 \u5F20\u3002", { block: 6, prep: 1 }),
    food("salmon", "\u719F\u9C91\u9C7C", "cooked_salmon", "protein", 1, "\u9020\u6210 8 \u70B9\u4F24\u5BB3\u3002", { damage: 8, after: "staple", bonus: 4, detail: "\u53F0\u4E0A\u5DF2\u6709\u4E3B\u98DF\u65F6\uFF0C\u989D\u5916\u9020\u6210 4 \u70B9\u4F24\u5BB3\u3002" }),
    food("chicken", "\u719F\u9E21\u8089", "cooked_chicken", "protein", 1, "\u9020\u6210 6 \u70B9\u4F24\u5BB3\uFF0C\u83B7\u5F97 4 \u70B9\u62A4\u76FE\u3002", { damage: 6, block: 4 }),
    food("beef", "\u725B\u6392", "cooked_beef", "protein", 2, "\u9020\u6210 16 \u70B9\u4F24\u5BB3\u3002", { damage: 16, after: "plant", bonus: 8, detail: "\u53F0\u4E0A\u5DF2\u6709\u852C\u679C\u65F6\uFF0C\u989D\u5916\u9020\u6210 8 \u70B9\u4F24\u5BB3\u3002" }),
    food("carrot", "\u80E1\u841D\u535C", "carrot", "plant", 1, "\u9020\u6210 3 \u70B9\u4F24\u5BB3\uFF0C\u83B7\u5F97 4 \u70B9\u62A4\u76FE\u3002", { damage: 3, block: 4 }),
    food("apple", "\u82F9\u679C", "apple", "plant", 0, "\u62BD 1 \u5F20\u724C\u3002\u6D88\u8017\uFF08\u672C\u573A\u53EA\u7528\u4E00\u6B21\uFF09\u3002", { draw: 1, exhaust: true }),
    food("water", "\u767D\u6C34", "potion", "water", 0, "\u83B7\u5F97 2 \u70B9\u62A4\u76FE\u3002\u6D88\u8017\uFF08\u672C\u573A\u53EA\u7528\u4E00\u6B21\uFF09\u3002", { block: 2, exhaust: true }),
    food("cookie", "\u66F2\u5947", "cookie", "treat", 0, "\u9020\u6210 5 \u70B9\u4F24\u5BB3\uFF0C\u8FD4\u8FD8 1 \u884C\u52A8\u3002\u6D88\u8017\uFF08\u672C\u573A\u53EA\u7528\u4E00\u6B21\uFF09\u3002", { damage: 5, energy: 1, exhaust: true }),
    food("melon", "\u897F\u74DC\u7247", "melon_slice", "plant", 0, "\u83B7\u5F97 4 \u70B9\u62A4\u76FE\u3002\u6D88\u8017\uFF08\u672C\u573A\u53EA\u7528\u4E00\u6B21\uFF09\u3002", { block: 4, exhaust: true }),
    food("beetroot", "\u751C\u83DC\u6839", "beetroot", "plant", 1, "\u9020\u6210 4 \u70B9\u4F24\u5BB3\uFF0C\u62BD 1 \u5F20\u3002", { damage: 4, draw: 1, drawWithWater: 1, detail: "\u53F0\u4E0A\u5DF2\u6709\u996E\u6C34\u65F6\uFF0C\u989D\u5916\u62BD 1 \u5F20\u3002" }),
    food("stew", "\u8611\u83C7\u7172", "mushroom_stew", "dish", 1, "\u83B7\u5F97 9 \u70B9\u62A4\u76FE\uFF0C\u62BD 1 \u5F20\u3002", { block: 9, draw: 1, energyWithVariety: 1, detail: "\u53F0\u4E0A\u5DF2\u6709\u4E24\u7C7B\u98DF\u6750\u65F6\uFF0C\u8FD4\u8FD8 1 \u884C\u52A8\u3002" }),
    food("beetSoup", "\u751C\u83DC\u6C64", "beetroot_soup", "dish", 1, "\u83B7\u5F97 10 \u70B9\u62A4\u76FE\u3002\u4E0B\u4E00\u56DE\u5408\u591A\u62BD 1 \u5F20\u3002", { block: 10, prep: 1 }),
    food("rabbit", "\u5154\u8089\u7172", "rabbit_stew", "dish", 2, "\u9020\u6210 14 \u70B9\u4F24\u5BB3\uFF0C\u83B7\u5F97 10 \u70B9\u62A4\u76FE\u3002", { damage: 14, block: 10, energyWithVariety: 1, detail: "\u53F0\u4E0A\u5DF2\u6709\u4E24\u7C7B\u98DF\u6750\u65F6\uFF0C\u8FD4\u8FD8 1 \u884C\u52A8\u3002" }),
    food("cake", "\u86CB\u7CD5", "cake", "treat", 1, "\u9020\u6210 13 \u70B9\u4F24\u5BB3\uFF0C\u62BD 2 \u5F20\u3002\u6D88\u8017\uFF08\u672C\u573A\u53EA\u7528\u4E00\u6B21\uFF09\u3002", { damage: 13, draw: 2, exhaust: true }),
    food("pie", "\u5357\u74DC\u6D3E", "pumpkin_pie", "treat", 1, "\u9020\u6210 10 \u70B9\u4F24\u5BB3\uFF0C\u8FD4\u8FD8 1 \u884C\u52A8\u3002\u6D88\u8017\uFF08\u672C\u573A\u53EA\u7528\u4E00\u6B21\uFF09\u3002", { damage: 10, energy: 1, exhaust: true })
  ];
  var foodById = Object.fromEntries(pantry.map((card) => [card.id, card]));
  var recipes = [
    {
      id: "meal",
      name: "\u5DE5\u4F5C\u53F0\u4E09\u4EF6\u5957",
      need: ["staple", "protein", "plant"],
      block: 6,
      damage: 8,
      text: "\u4E3B\u98DF + \u86CB\u767D\u98DF\u6750 + \u852C\u679C",
      result: "\u989D\u5916 8 \u4F24\u5BB3\u30016 \u62A4\u76FE"
    },
    {
      id: "river",
      name: "\u6CB3\u5CB8\u665A\u9910",
      need: ["potato", "salmon", "carrot"],
      damage: 12,
      draw: 1,
      text: "\u70E4\u9A6C\u94C3\u85AF + \u719F\u9C91\u9C7C + \u80E1\u841D\u535C",
      result: "\u989D\u5916 12 \u4F24\u5BB3\u3001\u62BD 1 \u5F20\uFF0C\u53EF\u53E0\u52A0\u4E09\u4EF6\u5957"
    },
    {
      id: "field",
      name: "\u519C\u7530\u6C34\u9053",
      need: ["plant", "water"],
      block: 5,
      draw: 1,
      text: "\u4EFB\u610F\u852C\u679C + \u767D\u6C34",
      result: "\u989D\u5916 5 \u62A4\u76FE\u3001\u62BD 1 \u5F20"
    },
    {
      id: "camp",
      name: "\u7089\u8FB9\u70ED\u996D",
      need: ["bread", "chicken"],
      energy: 1,
      block: 4,
      text: "\u9762\u5305 + \u719F\u9E21\u8089",
      result: "\u8FD4\u8FD8 1 \u884C\u52A8\u3001\u989D\u5916 4 \u62A4\u76FE"
    },
    {
      id: "dessert",
      name: "\u6700\u540E\u4E00\u53E3",
      need: ["meal", "treat"],
      draw: 2,
      text: "\u5148\u51D1\u9F50\u4E09\u4EF6\u5957\uFF0C\u518D\u6253\u4E00\u5F20\u751C\u70B9",
      result: "\u62BD 2 \u5F20\u3002\u751C\u70B9\u4ECD\u4F1A\u89E6\u53D1\u654C\u4EBA\u7684\u54CD\u5E94"
    }
  ];
  var starter = [
    "potato",
    "salmon",
    "carrot",
    "apple",
    "cookie",
    "bread",
    "chicken",
    "water",
    "carrot",
    "bread",
    "salmon"
  ];
  var rewardPool = pantry.map((card) => card.id);
  var sources = {
    diet: ["\u4E16\u536B\u7EC4\u7EC7 \xB7 \u5065\u5EB7\u996E\u98DF", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"],
    sugar: ["\u4E16\u536B\u7EC4\u7EC7 \xB7 \u6E38\u79BB\u7CD6\u4E0E\u9F8B\u9F7F", "https://www.who.int/news-room/fact-sheets/detail/sugars-and-dental-caries"],
    salt: ["\u4E16\u536B\u7EC4\u7EC7 \xB7 \u51CF\u94A0", "https://www.who.int/news-room/fact-sheets/detail/sodium-reduction"],
    fiber: ["\u7F8E\u56FD NIDDK \xB7 \u4FBF\u79D8\u4E0E\u996E\u98DF", "https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/eating-diet-nutrition"]
  };
  var counter = (kind, target, penalty, relief) => ({ kind, target, penalty, relief });
  var foes = {
    market: {
      name: "\u96F6\u98DF\u53F2\u83B1\u59C6",
      image: "slime_ball",
      track: "\u96F6\u98DF\u66FF\u6B63\u9910",
      hp: 62,
      pattern: [
        { damage: 10, label: "\u8BD5\u63A2\u5F39\u8DF3", counter: counter("variety", 2, 4, 3) },
        { damage: 14, block: 6, label: "\u5206\u88C2\u62A4\u58F3", counter: counter("guard", 8, 4, 2) },
        { damage: 21, interrupt: 8, label: "\u84C4\u529B\u91CD\u538B" }
      ],
      rule: "\u53EA\u51FA\u751C\u70B9\u65F6\u989D\u5916\u9020\u6210 6 \u4F24\u5BB3\u3002\u9047\u5230\u84C4\u529B\u91CD\u538B\uFF0C\u5408\u6210\u4EFB\u610F\u914D\u65B9\u53EF\u4EE5\u524A\u5F31\u5B83\u3002",
      note: "\u96F6\u98DF\u4E5F\u53EF\u4EE5\u51FA\u73B0\u5728\u65E5\u5E38\u996E\u98DF\u91CC\u3002\u957F\u671F\u628A\u751C\u70B9\u5F53\u4F5C\u6B63\u9910\uFF0C\u4F1A\u6324\u5360\u5176\u4ED6\u98DF\u7269\u7684\u4F4D\u7F6E\u3002",
      source: "diet"
    },
    breakfast: {
      name: "\u8FDF\u5230\u5E7B\u5F71",
      image: "clock_00",
      track: "\u8D76\u8BFE\u6F0F\u9910",
      hp: 61,
      pattern: [
        { damage: 11, label: "\u94C3\u58F0\u54CD\u8D77", counter: counter("variety", 2, 4, 3) },
        { damage: 17, label: "\u8D76\u8BFE\u51B2\u523A", counter: counter("guard", 8, 5, 3) }
      ],
      rule: "\u672C\u56DE\u5408\u6CA1\u51FA\u4E3B\u98DF\u65F6\uFF0C\u4E0B\u56DE\u5408\u5C11 1 \u884C\u52A8\u3002\u94FA\u4E3B\u98DF\u53EF\u5173\u6389\u8FD9\u4E00\u610F\u56FE\u3002",
      note: "\u65E9\u8BFE\u53EF\u4EE5\u63D0\u524D\u51C6\u5907\u591A\u79CD\u98DF\u7269\u642D\u914D\u3002\u4E3B\u98DF\u3001\u86CB\u767D\u98DF\u7269\u548C\u852C\u679C\u662F\u4FBF\u4E8E\u8BB0\u4F4F\u7684\u9009\u9910\u601D\u8DEF\u3002",
      source: "diet"
    },
    repeat: {
      name: "\u5355\u683C\u672B\u5F71\u536B",
      image: "ender_eye",
      track: "\u6BCF\u5929\u53EA\u5403\u540C\u4E00\u5957",
      hp: 64,
      pattern: [
        { damage: 12, label: "\u76EF\u4E0A\u80CC\u5305", counter: counter("variety", 3, 5, 4) },
        { damage: 15, label: "\u5355\u683C\u590D\u5236", counter: counter("recipe", 1, 4, 3) }
      ],
      rule: "\u6BCF\u56DE\u5408\u9996\u6B21\u6253\u51FA\u91CD\u590D\u7C7B\u522B\u65F6\uFF0C\u5B83\u5148\u83B7\u5F97 9 \u70B9\u62A4\u76FE\u3002\u6DF7\u7740\u6253\u6216\u7528\u7EC4\u5408\u4F24\u5BB3\u7834\u76FE\u3002",
      note: "\u591A\u6837\u5316\u8981\u770B\u4E00\u6BB5\u65F6\u95F4\u7684\u996E\u98DF\u3002\u8F6E\u6362\u98DF\u7269\u6709\u52A9\u4E8E\u6444\u5165\u4E0D\u540C\u8425\u517B\u7D20\u3002",
      source: "diet"
    },
    web: {
      name: "\u9ECF\u7F51\u722C\u86DB",
      image: "string",
      track: "\u81B3\u98DF\u7EA4\u7EF4\u6444\u5165\u4E0D\u8DB3",
      hp: 68,
      pattern: [{ damage: 13, label: "\u7F20\u7F51" }, { damage: 16, label: "\u6536\u7D27", counter: counter("guard", 8, 5, 4) }],
      rule: "\u56DE\u5408\u7ED3\u675F\u65F6\uFF0C\u82E5\u6CA1\u540C\u65F6\u6253\u51FA\u852C\u679C\u4E0E\u767D\u6C34\uFF0C\u4E0B\u56DE\u5408\u5C11\u62BD 1 \u5F20\u3002\u6BCF\u573A\u8FD8\u80FD\u989D\u5916\u83B7\u5F97\u4E00\u74F6\u767D\u6C34\u3002",
      note: "\u5168\u8C37\u7269\u3001\u8C46\u7C7B\u3001\u852C\u679C\u90FD\u53EF\u4EE5\u63D0\u4F9B\u81B3\u98DF\u7EA4\u7EF4\u3002\u6444\u5165\u8DB3\u91CF\u81B3\u98DF\u7EA4\u7EF4\u548C\u6DB2\u4F53\uFF0C\u6709\u52A9\u4E8E\u9884\u9632\u6216\u7F13\u89E3\u90E8\u5206\u4FBF\u79D8\u3002",
      source: "fiber"
    },
    salt: {
      name: "\u76D0\u58F3\u77FF\u536B",
      image: "quartz",
      track: "\u957F\u671F\u9AD8\u94A0\u996E\u98DF",
      hp: 72,
      block: 14,
      pattern: [
        { damage: 12, block: 12, label: "\u76D0\u58F3\u518D\u751F", counter: counter("recipe", 1, 5, 4) },
        { damage: 20, block: 7, interrupt: 8, label: "\u77FF\u9550\u84C4\u529B" }
      ],
      rule: "\u5F00\u5C40\u4E0E\u884C\u52A8\u540E\u5747\u6709\u62A4\u76FE\u3002\u89E6\u53D1\u4EFB\u610F\u5DE5\u4F5C\u53F0\u914D\u65B9\u65F6\uFF0C\u5148\u6E05\u6389\u73B0\u6709\u76D0\u58F3\uFF0C\u518D\u7ED3\u7B97\u914D\u65B9\u3002",
      note: "\u957F\u671F\u6444\u5165\u8FC7\u591A\u94A0\u4F1A\u5347\u9AD8\u8840\u538B\uFF0C\u589E\u52A0\u5FC3\u8840\u7BA1\u75BE\u75C5\u98CE\u9669\u3002\u53EF\u4EE5\u7559\u610F\u9AD8\u94A0\u8C03\u5473\u6599\u548C\u52A0\u5DE5\u98DF\u54C1\u7684\u6807\u7B7E\u3002",
      source: "salt"
    },
    caries: {
      name: "\u9F8B\u9F7F\u8B66\u62A5",
      image: "sugar",
      track: "\u9891\u7E41\u63A5\u89E6\u6E38\u79BB\u7CD6",
      hp: 68,
      pattern: [
        { damage: 12, label: "\u8B66\u62A5\u95EA\u70C1", counter: counter("variety", 2, 5, 3) },
        { damage: 17, label: "\u4E8C\u6B21\u8B66\u62A5", counter: counter("guard", 10, 5, 3) }
      ],
      rule: "\u540C\u56DE\u5408\u6BCF\u6253\u51FA\u7B2C 2 \u5F20\u53CA\u4E4B\u540E\u7684\u751C\u70B9\uFF0C\u4E0B\u4E00\u51FB\u5C31\u989D\u5916\u9020\u6210 7 \u70B9\u4F24\u5BB3\u3002",
      note: "\u9F8B\u75C5\u6D89\u53CA\u591A\u4E2A\u56E0\u7D20\uFF0C\u51CF\u5C11\u6E38\u79BB\u7CD6\u66B4\u9732\u6709\u52A9\u4E8E\u964D\u4F4E\u98CE\u9669\u3002\u6E38\u620F\u4E2D\u7684\u56DE\u5408\u548C\u51FA\u724C\u6B21\u6570\u4EC5\u7528\u4E8E\u8868\u73B0\u8282\u594F\u3002",
      source: "sugar"
    },
    pressure: {
      name: "\u8840\u538B\u8B66\u62A5",
      image: "redstone",
      track: "\u76D0\u58F3\u77FF\u9053 \xB7 \u9AD8\u8840\u538B\u98CE\u9669",
      hp: 74,
      pattern: [{ damage: 10, block: 8, label: "\u7EA2\u77F3\u8BFB\u6570" }, { damage: 15, label: "\u62A5\u8B66", counter: counter("recipe", 1, 6, 4) }],
      rule: "\u6BCF\u591A\u62D6\u4E00\u56DE\u5408\uFF0C\u540E\u7EED\u653B\u51FB\u90FD\u589E\u52A0 3 \u70B9\u4F24\u5BB3\u3002\u62A4\u76FE\u53EA\u80FD\u6321\u5F53\u524D\u4E00\u51FB\uFF0C\u5C3D\u65E9\u63A5\u4E0A\u914D\u65B9\u3002",
      note: "\u957F\u671F\u9AD8\u94A0\u996E\u98DF\u53EA\u662F\u9AD8\u8840\u538B\u7684\u591A\u4E2A\u98CE\u9669\u56E0\u7D20\u4E4B\u4E00\u3002\u73B0\u5B9E\u4E2D\u7684\u8840\u538B\u9700\u901A\u8FC7\u89C4\u8303\u6D4B\u91CF\u5224\u65AD\u3002\u6E38\u620F\u91CC\u7684\u8B66\u62A5\u8BFB\u6570\u662F\u56DE\u5408\u8BA1\u6570\u3002",
      source: "salt"
    },
    boss: {
      name: "\u6EE1\u683C\u5E7B\u8C61",
      image: "golden_apple",
      track: "\u7EC8\u5C40 \xB7 \u9971\u98DF\u6EE1\u683C\u7684\u8FF7\u601D",
      hp: 138,
      block: 12,
      pattern: [
        { damage: 14, label: "\u9971\u98DF\u523B\u5EA6", counter: counter("variety", 3, 5, 4) },
        { damage: 12, block: 12, label: "\u91D1\u5149\u62A4\u58F3", counter: counter("guard", 10, 6, 3) },
        { damage: 23, interrupt: 8, label: "\u84C4\u529B\u626B\u51FB" }
      ],
      enraged: [
        { damage: 20, label: "\u8FC7\u8F7D\u51B2\u51FB", counter: counter("recipe", 1, 7, 5) },
        { damage: 15, block: 10, label: "\u5149\u5E55\u56DE\u62A4", counter: counter("guard", 12, 6, 4) },
        { damage: 27, interrupt: 10, label: "\u6EE1\u683C\u84C4\u529B" }
      ],
      rule: "\u4E0A\u534A\u573A\u9996\u4E2A\u91CD\u590D\u7C7B\u522B\u7ED9\u5B83 9 \u62A4\u76FE\u3002\u534A\u8840\u540E\u653B\u52BF\u5347\u7EA7\uFF0C\u6CA1\u5408\u6210\u914D\u65B9\u65F6\u989D\u5916\u9020\u6210 7 \u4F24\u5BB3\u3002\u84C4\u529B\u56DE\u5408\u53EF\u7528\u914D\u65B9\u524A\u5F31\u3002",
      note: "\u9971\u8179\u611F\u548C\u81B3\u98DF\u591A\u6837\u6027\u662F\u4E0D\u540C\u7684\u6982\u5FF5\u3002\u628A\u89C6\u91CE\u62C9\u5230\u4E00\u6BB5\u65F6\u95F4\uFF0C\u770B\u98DF\u7269\u642D\u914D\u548C\u4E60\u60EF\u3002",
      source: "diet"
    }
  };

  // src/food-run.js
  var trail = [
    [{ id: "start", name: "\u8425\u5730", next: ["market"] }],
    [{ id: "market", next: ["breakfast", "repeat"] }],
    [{ id: "breakfast", next: ["web", "salt"] }, { id: "repeat", next: ["web", "salt"] }],
    [{ id: "web", next: ["camp", "caries"] }, { id: "salt", next: ["camp", "caries", "pressure"] }],
    [{ id: "camp", name: "\u7BDD\u706B\u8865\u7ED9", next: ["boss"] }, { id: "caries", next: ["boss"] }, { id: "pressure", next: ["boss"] }],
    [{ id: "boss", next: [] }]
  ];
  function makeFood(id) {
    const food2 = foodById[id];
    const card = new Card({
      name: food2.name,
      type: food2.damage ? "attack" : "skill",
      energy: food2.cost,
      target: food2.damage ? "enemy" : "player",
      damage: food2.damage,
      block: food2.block,
      exhaust: food2.exhaust,
      description: food2.text + (food2.detail ?? ""),
      image: food2.image
    });
    card.foodId = id;
    return card;
  }
  function upgradeFood(card) {
    return {
      ...card,
      name: card.name + " +",
      upgraded: true,
      damage: card.damage ? card.damage + 3 : 0,
      block: card.block ? card.block + 3 : 0
    };
  }
  var campRecovery = (challenge) => challenge ? 16 : 22;
  function makeTrail(challenge) {
    const graph = trail.map((floor, y) => floor.map((entry, x) => {
      let room = StartRoom();
      if (entry.id === "camp") room = CampfireRoom();
      const foe = foes[entry.id];
      if (foe) room = MonsterRoom(Monster({
        name: foe.name,
        hp: challenge ? Math.round(foe.hp * 1.2) : foe.hp,
        block: foe.block,
        intents: foe.pattern
      }));
      return { ...entry, x, y, room, type: room.type, edges: entry.next, didVisit: y === 0 };
    }));
    return { graph, x: 0, y: 0, pathTaken: [[0, 0]] };
  }
  var nodeAt = (state2) => state2.dungeon.graph[state2.dungeon.y][state2.dungeon.x];
  var enemyAt = (state2) => getCurrRoom(state2).monsters?.[0];
  var foodOf = (card) => foodById[card.foodId];
  var emptyTable = () => ({ groups: [], cards: [], recipes: [], prep: 0, repeat: false, tactic: null, reserved: null });
  function newFoodRun(challenge = false) {
    const state2 = actions_default.setDungeon(actions_default.createNewState(), makeTrail(challenge));
    return {
      ...state2,
      deck: starter.map(makeFood),
      phase: "intro",
      challenge,
      table: emptyTable(),
      round: 1,
      rewards: [],
      learned: [],
      crafted: 0,
      countersCleared: 0,
      message: "\u628A\u98DF\u6750\u5E26\u8FDB\u5DE5\u4F5C\u53F0\uFF0C\u8BD5\u8BD5\u80FD\u914D\u51FA\u4EC0\u4E48\u3002"
    };
  }
  function accessibleNodes(state2) {
    return (state2.dungeon.graph[state2.dungeon.y + 1] ?? []).filter(
      (node) => nodeAt(state2).edges.includes(node.id)
    );
  }
  function travel(state2, id) {
    if (!["route", "intro"].includes(state2.phase)) return state2;
    const node = accessibleNodes(state2).find((node2) => node2.id === id);
    if (!node) return state2;
    let next = actions_default.move(state2, { move: { x: node.x, y: node.y } });
    if (id === "market") {
      next = { ...next, hand: state2.deck.slice(0, 5), drawPile: shuffle(state2.deck.slice(5)) };
    }
    if (id === "web") next = actions_default.addCardToHand(next, { card: makeFood("water") });
    return {
      ...next,
      phase: node.room.type === "campfire" ? "camp" : "fight",
      round: 1,
      rewards: [],
      table: emptyTable(),
      tacticsLeft: state2.challenge ? 1 : 2,
      hit: 0,
      combined: false,
      repeatTriggered: false,
      message: ""
    };
  }
  function startChallenge(state2) {
    return state2.phase === "intro" ? travel(newFoodRun(true), "market") : state2;
  }
  function tally(cards2, group) {
    return cards2.filter((id) => foodById[id].group === group).length;
  }
  function isBossSecondPhase(state2) {
    const enemy = enemyAt(state2);
    return nodeAt(state2).id === "boss" && enemy.currentHealth <= enemy.maxHealth / 2;
  }
  function intentFor(state2) {
    const enemy = enemyAt(state2);
    const { id } = nodeAt(state2);
    const pattern = isBossSecondPhase(state2) ? foes[id].enraged : enemy.intents;
    const intent = { ...pattern[enemy.nextIntent] };
    if (state2.challenge && intent.damage > 0) intent.damage += 3;
    intent.baseDamage = intent.damage;
    const { table } = state2;
    const sweets = tally(table.cards, "treat");
    if (id === "market" && sweets > 0 && sweets === table.cards.length) intent.damage += 6;
    if (id === "breakfast" && !table.groups.includes("staple")) intent.energyLoss = 1;
    if (id === "web" && !table.recipes.includes("field")) intent.drawLoss = 1;
    if (id === "caries" && sweets > 1) intent.damage += 7 * (sweets - 1);
    if (id === "pressure") intent.damage += 3 * (state2.round - 1);
    if (id === "boss" && isBossSecondPhase(state2) && table.recipes.length === 0) intent.damage += 7;
    if (intent.interrupt && table.recipes.length) {
      intent.damage = Math.max(0, intent.damage - intent.interrupt);
      intent.interrupted = true;
    }
    if (intent.counter) {
      const { kind, target, penalty, relief } = intent.counter;
      const progress = kind === "guard" ? state2.player.block : kind === "recipe" ? table.recipes.length : table.groups.filter((group) => ["staple", "protein", "plant"].includes(group)).length;
      const met = progress >= target;
      intent.counter = { ...intent.counter, progress: Math.min(progress, target), met };
      intent.damage = Math.max(0, intent.damage + (met ? -relief : penalty));
    }
    if (table.tactic === "dampen") intent.damage = Math.max(0, intent.damage - 7);
    if (table.tactic === "crack") intent.block = Math.max(0, (intent.block ?? 0) - 6);
    return intent;
  }
  function canUseTactic(state2, tactic) {
    if (state2.phase !== "fight" || !state2.tacticsLeft || state2.table.tactic) return false;
    if (tactic === "dampen") return intentFor(state2).damage > 0;
    if (tactic === "crack") return enemyAt(state2).block > 0 || (intentFor(state2).block ?? 0) > 0;
    if (!state2.hand.length) return false;
    if (tactic === "swap") return state2.drawPile.length + state2.discardPile.length > 0;
    return tactic === "reserve";
  }
  function useTactic(state2, tactic, uid) {
    if (!canUseTactic(state2, tactic)) return state2;
    const selectsCard = tactic === "reserve" || tactic === "swap";
    const selected = selectsCard ? state2.hand.find((card) => card.id === uid) : null;
    if (selectsCard && !selected) return state2;
    const next = tactic === "swap" ? actions_default.drawCards(state2, { amount: 1 }) : state2;
    return produce(next, (draft) => {
      draft.tacticsLeft--;
      draft.table.tactic = tactic;
      draft.hit = 0;
      draft.combined = false;
      draft.repeatTriggered = false;
      if (tactic === "crack") {
        const enemy = enemyAt(draft);
        enemy.block = Math.max(0, enemy.block - 10);
        draft.message = "\u53BB\u58F3\uFF1A\u5BF9\u624B\u73B0\u6709\u62A4\u76FE\u51CF\u5C11\uFF0C\u9884\u544A\u4E2D\u7684\u62A4\u76FE\u4E5F\u4F1A\u964D\u4F4E\u3002";
      } else if (tactic === "dampen") {
        draft.message = "\u538B\u706B\uFF1A\u5BF9\u624B\u672C\u56DE\u5408\u7684\u4F24\u5BB3\u6700\u591A\u964D\u4F4E 7 \u70B9\u3002";
      } else if (tactic === "swap") {
        draft.hand = draft.hand.filter((card) => card.id !== uid);
        draft.discardPile.push(selected);
        draft.message = "\u5DF2\u7528 " + selected.name + " \u6362\u6765\u4E00\u5F20\u65B0\u724C\u3002";
      } else {
        draft.table.reserved = selected;
        draft.hand = draft.hand.filter((card) => card.id !== uid);
        draft.message = "\u5DF2\u7559\u597D " + selected.name + "\uFF0C\u4E0B\u56DE\u5408\u56DE\u5230\u624B\u91CC\u3002";
      }
    });
  }
  function adjustEnemy(state2, change) {
    return produce(state2, (draft) => change(enemyAt(draft)));
  }
  function blockPlayer(state2, amount) {
    return produce(state2, (draft) => {
      draft.player.block += amount;
    });
  }
  function checkBattleEnd(state2) {
    if (!isCurrRoomCompleted(state2)) return state2;
    const id = nodeAt(state2).id;
    const won = isDungeonCompleted(state2);
    return {
      ...state2,
      phase: won ? "win" : "reward",
      won,
      endedAt: won ? Date.now() : void 0,
      learned: [...state2.learned, id],
      rewards: won ? [] : shuffle(rewardPool).slice(0, 3)
    };
  }
  function recipesForPlay(table, food2) {
    const laid = /* @__PURE__ */ new Set([...table.groups, ...table.cards, ...table.recipes, food2.group, food2.id]);
    const triggered = [];
    for (const recipe of recipes) {
      if (table.recipes.includes(recipe.id) || recipe.id === "dessert" && food2.group !== "treat") continue;
      if (!recipe.need.every((key) => laid.has(key))) continue;
      triggered.push(recipe);
      laid.add(recipe.id);
    }
    return triggered;
  }
  function playFood(state2, uid) {
    const card = state2.hand.find((entry) => entry.id === uid);
    if (state2.phase !== "fight" || !card || card.energy > state2.player.currentEnergy) return state2;
    const food2 = foodOf(card);
    const { table } = state2;
    const id = nodeAt(state2).id;
    const repeated = !table.repeat && table.groups.includes(food2.group) && (id === "repeat" || id === "boss" && !isBossSecondPhase(state2));
    let next = repeated ? adjustEnemy(state2, (enemy) => {
      enemy.block += 9;
    }) : state2;
    const bonus = table.groups.includes(food2.after) ? food2.bonus : 0;
    next = actions_default.playCard(next, {
      card: { ...card, damage: card.damage + bonus },
      target: card.target === "enemy" ? "enemy0" : "player"
    });
    if (bonus) {
      next = produce(next, (draft) => {
        const pile = card.exhaust ? draft.exhaustPile : draft.discardPile;
        pile[pile.length - 1] = card;
      });
    }
    const chain = {
      ...table,
      groups: [.../* @__PURE__ */ new Set([...table.groups, food2.group])],
      cards: [...table.cards, food2.id],
      recipes: [...table.recipes],
      prep: table.prep + (food2.prep ?? 0),
      repeat: repeated || table.repeat
    };
    const extraDraw = table.groups.includes("water") ? food2.drawWithWater ?? 0 : 0;
    let draw = (food2.draw ?? 0) + extraDraw;
    let energy = (food2.energy ?? 0) + (table.groups.length >= 2 ? food2.energyWithVariety ?? 0 : 0);
    const triggered = recipesForPlay(table, food2);
    for (const recipe of triggered) {
      chain.recipes.push(recipe.id);
      if (id === "salt") next = adjustEnemy(next, (enemy) => {
        enemy.block = 0;
      });
      if (recipe.block) next = blockPlayer(next, recipe.block);
      if (recipe.damage) next = actions_default.removeHealth(next, { target: "enemy0", amount: recipe.damage });
      energy += recipe.energy ?? 0;
      draw += recipe.draw ?? 0;
    }
    if (energy) next = actions_default.addEnergyToPlayer(next, { amount: energy });
    if (draw) next = actions_default.drawCards(next, { amount: draw });
    const message = [
      repeated ? "\u654C\u4EBA\u590D\u5236\u4E86\u7C7B\u522B\uFF0C\u83B7\u5F97 9 \u62A4\u76FE\u3002" : "",
      triggered.length ? "\u5408\u6210 " + triggered.map((recipe) => recipe.name).join("\u3001") + "\uFF01" : food2.name + "\u5DF2\u4E0A\u5DE5\u4F5C\u53F0\u3002"
    ].filter(Boolean).join(" ");
    return checkBattleEnd({
      ...next,
      table: chain,
      crafted: state2.crafted + triggered.length,
      message,
      hit: Math.max(0, enemyAt(state2).currentHealth - Math.max(0, enemyAt(next).currentHealth)),
      combined: triggered.length > 0,
      repeatTriggered: repeated
    });
  }
  function finishTurn(state2) {
    if (state2.phase !== "fight") return state2;
    const enemy = enemyAt(state2);
    const { damage, block, energyLoss, drawLoss, counter: counter2 } = intentFor(state2);
    const index = enemy.nextIntent;
    const baseIntent = enemy.intents[index];
    const withIntent = adjustEnemy(state2, (draft) => {
      draft.intents[index] = { damage, block };
    });
    let next = actions_default.endTurn(withIntent);
    next = adjustEnemy(next, (draft) => {
      draft.intents[index] = baseIntent;
    });
    if (next.player.currentHealth <= 0) return { ...next, phase: "lost" };
    if (drawLoss && next.hand.length) {
      next = produce(next, (draft) => {
        draft.drawPile.unshift(draft.hand.pop());
      });
    }
    if (state2.table.prep) next = actions_default.drawCards(next, { amount: state2.table.prep });
    if (state2.table.reserved) next = actions_default.addCardToHand(next, { card: state2.table.reserved });
    const loss = Math.max(0, state2.player.currentHealth - next.player.currentHealth);
    return produce(next, (draft) => {
      draft.table = emptyTable();
      draft.round++;
      draft.player.currentEnergy -= energyLoss ?? 0;
      draft.hit = 0;
      draft.combined = false;
      draft.repeatTriggered = false;
      draft.message = loss ? "\u4E0A\u4E00\u51FB\u6D88\u8017\u4E86 " + loss + " \u70B9\u8010\u529B\u3002" : "\u6321\u4F4F\u4E86\u4E0A\u4E00\u51FB\u3002";
      if (energyLoss) draft.message += " \u8FDF\u5230\u5E7B\u5F71\u6263\u9664 1 \u884C\u52A8\u3002";
      if (drawLoss) draft.message += " \u9ECF\u7F51\u8BA9\u4F60\u5C11\u62BD\u4E86 1 \u5F20\u3002";
      if (counter2) {
        if (counter2.met) draft.countersCleared++;
        draft.message += counter2.met ? " \u62C6\u62DB\u6210\u529F\u3002" : " \u672A\u62C6\u62DB\uFF0C\u5BF9\u624B\u52A0\u5F3A\u4E86\u653B\u51FB\u3002";
      }
    });
  }
  function takeReward(state2, id) {
    if (state2.phase !== "reward" || id && !state2.rewards.includes(id)) return state2;
    const next = id ? actions_default.addCardToDeck(state2, { card: makeFood(id) }) : state2;
    return { ...next, rewards: [], phase: "route" };
  }
  function campChoice(state2, choice, uid) {
    if (state2.phase !== "camp") return state2;
    if (choice === "rest") {
      const next = actions_default.addHealth(state2, { target: "player", amount: campRecovery(state2.challenge) });
      return { ...next, phase: "route" };
    }
    if (choice === "upgrade") {
      const card = state2.deck.find((entry) => entry.id === uid);
      if (!card || card.upgraded || !card.damage && !card.block) return state2;
      return { ...state2, deck: state2.deck.map((entry) => entry === card ? upgradeFood(card) : entry), phase: "route" };
    }
    return state2;
  }

  // src/hints.js
  function setupHints(panel) {
    let active = null;
    let pinned = false;
    let dismissed = null;
    let leaveTimer;
    const rootOf = (element) => element instanceof Element ? element.closest("[data-hint]") : null;
    function close() {
      clearTimeout(leaveTimer);
      active?.querySelector("[data-hint-toggle]")?.setAttribute("aria-expanded", "false");
      panel.hidden = true;
      active = null;
      pinned = false;
    }
    function position() {
      if (!active) return;
      const anchor = active.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      if (!active.isConnected || anchor.bottom < 0 || anchor.top > height) {
        close();
        return;
      }
      const gap = 8;
      const left = Math.max(gap, Math.min(anchor.left, width - panel.offsetWidth - gap));
      const above = anchor.top - panel.offsetHeight - gap;
      const below = anchor.bottom + gap;
      const top = above >= gap ? above : Math.max(gap, Math.min(below, height - panel.offsetHeight - gap));
      panel.style.left = left + "px";
      panel.style.top = top + "px";
    }
    function open(root, pin = false) {
      clearTimeout(leaveTimer);
      if (!pin && (root === dismissed || pinned)) return;
      if (active !== root) {
        const content = document.getElementById(root.dataset.hint);
        if (!content) return;
        close();
        active = root;
        panel.textContent = content.textContent;
        panel.hidden = false;
      }
      pinned = pin;
      root.querySelector("[data-hint-toggle]")?.setAttribute("aria-expanded", "true");
      position();
    }
    function leave(root) {
      if (dismissed === root) dismissed = null;
      if (active !== root || pinned || root.querySelector(":focus-visible")) return;
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(close, 170);
    }
    document.addEventListener("pointerover", (event) => {
      if (event.pointerType !== "mouse") return;
      if (panel.contains(event.target)) {
        clearTimeout(leaveTimer);
        return;
      }
      const root = rootOf(event.target);
      if (root && !root.contains(event.relatedTarget)) {
        dismissed = null;
        open(root);
      }
    });
    document.addEventListener("pointerout", (event) => {
      if (event.pointerType !== "mouse") return;
      const root = panel.contains(event.target) ? active : rootOf(event.target);
      if (root && !root.contains(event.relatedTarget) && !panel.contains(event.relatedTarget)) leave(root);
    });
    document.addEventListener("focusin", (event) => {
      const root = rootOf(event.target);
      if (root && event.target.matches(":focus-visible")) {
        dismissed = null;
        open(root);
      }
    });
    document.addEventListener("focusout", (event) => {
      const root = rootOf(event.target);
      if (!root || root.contains(event.relatedTarget)) return;
      if (dismissed === root) dismissed = null;
      if (root === active && !pinned && !root.matches(":hover")) close();
    });
    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-hint-toggle]");
      if (toggle) {
        const root = rootOf(toggle);
        if (active === root && pinned) {
          dismissed = root;
          close();
        } else {
          dismissed = null;
          open(root, true);
        }
      } else if (active && !panel.contains(event.target) && rootOf(event.target) !== active) {
        close();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !active) return;
      dismissed = active;
      close();
    });
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, { capture: true, passive: true });
    return { close };
  }

  // src/expedition.js
  var waypoints = {
    start: { name: "\u708A\u706B\u8425\u5730", enter: "\u5E26\u4E0A\u4E00\u526F\u98DF\u6750\u724C\uFF0C\u4ECE\u96F6\u98DF\u96C6\u5E02\u51FA\u53D1\u3002" },
    market: {
      name: "\u96F6\u98DF\u96C6\u5E02",
      enter: "\u56DE\u8425\u5730\u7684\u8DEF\u88AB\u4E00\u56E2\u53F2\u83B1\u59C6\u5835\u4F4F\u4E86\u3002\u5148\u628A\u624B\u91CC\u7684\u98DF\u6750\u914D\u6210\u4E00\u9910\u3002",
      clear: "\u53F2\u83B1\u59C6\u6563\u5F00\uFF0C\u96C6\u5E02\u7684\u8865\u7ED9\u7BB1\u9732\u4E86\u51FA\u6765\u3002"
    },
    breakfast: {
      name: "\u6668\u949F\u5C0F\u5DF7",
      enter: "\u94C3\u5DF2\u7ECF\u54CD\u4E86\u3002\u8FDF\u5230\u5E7B\u5F71\u8FD8\u60F3\u8BA9\u4F60\u7A7A\u7740\u80CC\u5305\u51B2\u8FC7\u53BB\u3002",
      clear: "\u94C3\u58F0\u505C\u4E86\u3002\u5C0F\u5DF7\u5C3D\u5934\u4F20\u6765\u77FF\u9550\u548C\u86DB\u7F51\u88AB\u62C9\u7D27\u7684\u58F0\u97F3\u3002"
    },
    repeat: {
      name: "\u672B\u5F71\u8D27\u67B6",
      enter: "\u8D27\u67B6\u4E0A\u53EA\u5269\u53CD\u590D\u8865\u8D27\u7684\u540C\u4E00\u683C\u3002\u672B\u5F71\u536B\u4F1A\u590D\u5236\u4F60\u6253\u8FC7\u7684\u98DF\u6750\u7C7B\u522B\u3002",
      clear: "\u8D27\u67B6\u7EC8\u4E8E\u591A\u51FA\u4E00\u683C\u3002\u7ED9\u540E\u9762\u7684\u8DEF\u518D\u6311\u4E00\u4EFD\u8865\u7ED9\u3002"
    },
    web: {
      name: "\u519C\u7530\u6DB5\u6D1E",
      enter: "\u53BB\u7530\u91CC\u7684\u6C34\u9053\u88AB\u86DB\u7F51\u7F20\u4F4F\u4E86\uFF0C\u6D1E\u53E3\u8FD8\u7559\u7740\u4E00\u74F6\u767D\u6C34\u3002",
      clear: "\u86DB\u7F51\u677E\u5F00\uFF0C\u6C34\u9053\u91CD\u65B0\u6D41\u4E86\u8D77\u6765\u3002"
    },
    salt: {
      name: "\u76D0\u58F3\u77FF\u9053",
      enter: "\u767D\u8272\u77FF\u58F3\u6BCF\u9694\u4E00\u9635\u5C31\u4F1A\u957F\u56DE\u6765\u3002\u5DE5\u4F5C\u53F0\u7684\u5408\u6210\u53EF\u4EE5\u628A\u5B83\u6253\u5F00\u3002",
      clear: "\u77FF\u58F3\u88C2\u5F00\u3002\u6D1E\u6DF1\u5904\u8FD8\u6709\u4E00\u5904\u8BFB\u6570\u4E0D\u65AD\u4E0A\u5347\u7684\u7EA2\u77F3\u8B66\u62A5\u3002"
    },
    camp: {
      name: "\u7089\u706B\u9A7F\u7AD9",
      enter: "\u79BB\u51FA\u53E3\u53EA\u5269\u6700\u540E\u4E00\u7AD9\u3002\u53EF\u4EE5\u6B47\u4E00\u6B47\uFF0C\u4E5F\u53EF\u4EE5\u8D81\u706B\u8FD8\u65FA\u7EC3\u4E00\u5F20\u724C\u3002"
    },
    caries: {
      name: "\u7CD6\u6676\u54E8\u7AD9",
      enter: "\u6BCF\u591A\u4E00\u6B21\u751C\u70B9\u51FA\u724C\uFF0C\u7CD6\u6676\u8B66\u62A5\u90FD\u53EF\u80FD\u53D8\u5F97\u66F4\u54CD\u3002\u5148\u770B\u770B\u5B83\u6253\u7B97\u505A\u4EC0\u4E48\u3002",
      clear: "\u8B66\u62A5\u505C\u4E86\u3002\u5E26\u597D\u8865\u7ED9\uFF0C\u53BB\u51FA\u53E3\u7684\u4FE1\u6807\u3002"
    },
    pressure: {
      name: "\u7EA2\u77F3\u6DF1\u4E95",
      enter: "\u7EA2\u77F3\u7684\u8BFB\u6570\u4F1A\u4E00\u8F6E\u8F6E\u5347\u9AD8\u3002\u5F97\u5728\u538B\u529B\u79EF\u8D77\u6765\u524D\u6253\u901A\u77FF\u4E95\u3002",
      clear: "\u4E95\u91CC\u7684\u7EA2\u77F3\u7184\u706D\u4E86\u3002\u51FA\u53E3\u4FE1\u6807\u5DF2\u7ECF\u770B\u5F97\u89C1\u4E86\u3002"
    },
    boss: {
      name: "\u6EE1\u683C\u4FE1\u6807",
      enter: "\u4FE1\u6807\u628A\u9971\u98DF\u523B\u5EA6\u586B\u6EE1\uFF0C\u7167\u51FA\u4E00\u4E2A\u5E7B\u8C61\u3002\u7528\u5DE5\u4F5C\u53F0\u5E26\u56DE\u4E00\u4EFD\u914D\u5F97\u8D77\u6765\u7684\u665A\u9910\u3002",
      clear: "\u4FE1\u6807\u7684\u5047\u5149\u6563\u53BB\u3002\u8425\u5730\u5DF2\u7ECF\u70B9\u8D77\u7089\u706B\uFF0C\u7B49\u4F60\u5E26\u7740\u65B0\u914D\u65B9\u56DE\u6765\u3002"
    }
  };
  var textures = {
    steve: [64, 64],
    slime: [64, 32],
    enderman: [64, 32],
    enderman_eyes: [64, 32],
    cave_spider: [64, 32],
    phantom: [64, 64]
  };
  var silhouettes = {
    player: {
      size: [16, 32],
      faces: [
        ["steve", 8, 8, 8, 8, 4, 0],
        ["steve", 20, 20, 8, 12, 4, 8],
        ["steve", 44, 20, 4, 12, 0, 8],
        ["steve", 36, 52, 4, 12, 12, 8],
        ["steve", 4, 20, 4, 12, 4, 20],
        ["steve", 20, 52, 4, 12, 8, 20]
      ]
    },
    market: {
      size: [16, 16],
      faces: [
        ["slime", 8, 8, 8, 8, 0, 0, 2],
        ["slime", 6, 22, 6, 6, 2, 2, 2],
        ["slime", 34, 2, 2, 2, 3, 5, 2],
        ["slime", 34, 2, 2, 2, 9, 5, 2],
        ["slime", 34, 9, 1, 1, 8, 10, 2]
      ]
    },
    repeat: {
      size: [14, 42],
      faces: [
        ["enderman", 8, 8, 8, 8, 3, 0],
        ["enderman_eyes", 8, 8, 8, 8, 3, 0],
        ["enderman", 22, 20, 8, 12, 3, 8],
        ["enderman", 58, 2, 2, 23, 1, 8],
        ["enderman", 58, 2, 2, 23, 11, 8],
        ["enderman", 2, 2, 2, 22, 4, 20],
        ["enderman", 2, 2, 2, 22, 8, 20]
      ]
    },
    breakfast: {
      size: [26, 13],
      faces: [
        ["phantom", 23, 30, 6, 5, 0, 2],
        ["phantom", 9, 26, 6, 4, 6, 3],
        ["phantom", 5, 5, 7, 3, 10, 6],
        ["phantom", 9, 26, 6, 4, 16, 3],
        ["phantom", 23, 30, 6, 5, 21, 2]
      ]
    },
    web: {
      size: [28, 18],
      faces: [
        ["cave_spider", 8, 12, 12, 8, 8, 4],
        ["cave_spider", 40, 12, 8, 8, 10, 8],
        ["cave_spider", 36, 18, 6, 2, 3, 9],
        ["cave_spider", 36, 18, 6, 2, 19, 9],
        ["cave_spider", 36, 18, 6, 2, 0, 13],
        ["cave_spider", 36, 18, 6, 2, 22, 13]
      ]
    }
  };
  function patch([texture, x, y, width, height, left, top, magnification = 1]) {
    const [sheetWidth, sheetHeight] = textures[texture];
    const backgroundX = 100 * x / (sheetWidth - width);
    const backgroundY = 100 * y / (sheetHeight - height);
    return `<span class="texture-patch" style="--left:${left};--top:${top};--w:${width * magnification};--h:${height * magnification};
		background-image:url('./assets/${texture}.png');background-size:${100 * sheetWidth / width}% ${100 * sheetHeight / height}%;
		background-position:${backgroundX}% ${backgroundY}%"></span>`;
  }
  function portrait(id, emblem = "") {
    const model = silhouettes[id];
    if (!model) {
      return `<div class="sprite-art construct construct-${id}" aria-hidden="true"><i></i>
			<img src="./assets/${emblem}.png" class="pixel" alt="" draggable="false"><i></i></div>`;
    }
    return `<div class="sprite-art model model-${id}" style="--model-w:${model.size[0]};--model-h:${model.size[1]}"
		aria-hidden="true">${model.faces.map(patch).join("")}</div>`;
  }

  // src/card-motion.js
  var reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function cardInMotion(button) {
    if (reducedMotion()) return null;
    const rect = button.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const ghost = document.createElement("div");
    ghost.className = button.className + " flying-card";
    ghost.innerHTML = button.innerHTML;
    ghost.setAttribute("aria-hidden", "true");
    Object.assign(ghost.style, {
      left: rect.left + "px",
      top: rect.top + "px",
      width: rect.width + "px",
      height: rect.height + "px"
    });
    return { ghost, rect };
  }
  function flyToTable(flight, slot) {
    if (!flight || !slot) return;
    const { ghost, rect } = flight;
    const to = slot.getBoundingClientRect();
    if (!to.width) return;
    const visibleSlot = to.top >= 0 && to.bottom <= window.innerHeight;
    const dx = to.left + to.width / 2 - (rect.left + rect.width / 2);
    const dy = to.top + to.height / 2 - (rect.top + rect.height / 2);
    const scale = Math.min(to.width / rect.width, to.height / rect.height);
    const transform = (x, y, s, rotation) => `translate(${x}px,${y}px) scale(${s}) rotate(${rotation}deg)`;
    document.querySelector(".flying-card")?.remove();
    document.body.append(ghost);
    const start = { transform: transform(0, 0, 1, 0), opacity: 1 };
    const frames = visibleSlot ? [
      start,
      { transform: transform(dx * 0.08, -10, 1.03, -3), opacity: 1, offset: 0.26 },
      { transform: transform(dx, dy, scale, 0), opacity: 0.75, offset: 0.86 },
      { transform: transform(dx, dy, scale, 0), opacity: 0 }
    ] : [start, { transform: transform(0, -26, 0.84, -3), opacity: 0 }];
    const motion = ghost.animate(frames, { duration: visibleSlot ? 310 : 175, easing: "ease-out" });
    if (visibleSlot) {
      slot.animate([
        { opacity: 0.2, offset: 0 },
        { opacity: 0.2, offset: 0.7 },
        { opacity: 1, transform: "scale(.96)", offset: 0.88 },
        { opacity: 1, transform: "scale(1)" }
      ], { duration: 330 });
    }
    motion.finished.then(() => ghost.remove(), () => ghost.remove());
  }

  // src/sound.js
  var scores = {
    camp: { bpm: 102, melody: [67, 71, 74, 0, 76, 74, 71, 69, 65, 69, 72, 0, 74, 72, 69, 67], roots: [43, 45, 41, 43] },
    fight: { bpm: 126, melody: [62, 0, 65, 69, 67, 65, 62, 0, 60, 64, 67, 0, 69, 67, 64, 60], roots: [38, 46, 36, 45], drums: true },
    boss: { bpm: 144, melody: [62, 65, 63, 62, 57, 0, 62, 58, 60, 63, 60, 0, 61, 64, 67, 64], roots: [38, 34, 36, 37], drums: true },
    bossLate: { bpm: 154, melody: [74, 0, 69, 74, 75, 72, 69, 0, 69, 70, 72, 67, 74, 70, 69, 65], roots: [38, 34, 36, 37], drums: true },
    win: { bpm: 112, melody: [67, 72, 76, 79, 0, 76, 74, 72], roots: [48, 53, 55, 48] },
    lost: { bpm: 82, melody: [69, 0, 65, 0, 64, 62, 0, 57], roots: [45, 41, 38, 45] }
  };
  var effects = {
    play: [60, 67],
    recipe: [60, 64, 67, 76],
    tactic: [52, 64],
    interrupt: [65, 60, 48],
    enemy: [46, 42],
    reward: [65, 69, 72],
    travel: [62, 69]
  };
  var hz = (note) => 440 * 2 ** ((note - 69) / 12);
  function makeLoop(ctx, score) {
    const rate = 22050;
    const step = 30 / score.bpm;
    const buffer = ctx.createBuffer(1, Math.round(32 * step * rate), rate);
    const samples = buffer.getChannelData(0);
    function voice(index, frequency, duration, volume, color) {
      const start = Math.round(index * step * rate);
      const length = Math.round(duration * rate);
      for (let i = 0; i < length; i++) {
        const t = i / rate;
        const phase = 2 * Math.PI * frequency * t;
        const envelope = Math.min(1, t / 9e-3) * (1 - i / length) ** 2;
        samples[(start + i) % samples.length] += volume * envelope * (Math.sin(phase) + color * Math.sin(2 * phase));
      }
    }
    for (let i = 0; i < 32; i++) {
      const root = score.roots[Math.floor(i / 8) % score.roots.length];
      const melody = score.melody[i % score.melody.length];
      if (melody) voice(i, hz(melody), step * 1.8, 0.21, 0.38);
      if (i % 2 === 0) voice(i, hz(root), step * 2, 0.24, 0.21);
      if (i % 8 === 0) voice(i, hz(root + 19), step * 6, 0.115, 0.2);
      if (score.drums && i % 4 === 0) voice(i, 57, 0.12, 0.23, 0.2);
      if (score.drums && i % 4 === 2) voice(i, 147, 0.064, 0.085, 0.6);
    }
    return buffer;
  }
  var CanteenSound = class {
    constructor(button) {
      this.button = button;
      this.enabled = true;
      this.buffers = /* @__PURE__ */ new Map();
      try {
        this.enabled = localStorage.getItem("canteen-sound") !== "off";
      } catch {
      }
      this.updateButton();
      document.addEventListener("visibilitychange", () => {
        if (!this.ctx) return;
        const operation = document.hidden ? this.ctx.suspend() : this.ctx.resume();
        operation.catch(() => {
        });
      });
    }
    updateButton() {
      this.button.textContent = this.enabled ? this.ctx ? "\u97F3\u4E50\u5F00" : "\u64AD\u653E\u97F3\u4E50" : "\u97F3\u4E50\u5173";
      this.button.setAttribute("aria-pressed", String(this.enabled));
    }
    toggle() {
      if (!this.ctx && this.enabled) {
        this.unlock();
        return;
      }
      this.enabled = !this.enabled;
      try {
        localStorage.setItem("canteen-sound", this.enabled ? "on" : "off");
      } catch {
      }
      this.updateButton();
      if (this.enabled) this.unlock();
      if (this.music) this.music.gain.setTargetAtTime(this.enabled ? 0.76 : 0, this.ctx.currentTime, 0.06);
    }
    unlock() {
      try {
        if (!this.ctx) {
          const Context = window.AudioContext || window.webkitAudioContext;
          if (!Context) {
            this.button.textContent = "\u97F3\u4E50\u4E0D\u53EF\u7528";
            this.button.disabled = true;
            return;
          }
          this.ctx = new Context();
          this.master = this.ctx.createGain();
          this.music = this.ctx.createGain();
          this.effects = this.ctx.createGain();
          this.master.gain.value = 0.65;
          this.music.gain.value = this.enabled ? 0.76 : 0;
          this.effects.gain.value = 0.68;
          this.music.connect(this.master);
          this.effects.connect(this.master);
          this.master.connect(this.ctx.destination);
        }
        this.ctx.resume().catch(() => {
        });
        this.setScene(this.wanted || "camp");
        this.updateButton();
      } catch {
      }
    }
    setScene(track) {
      this.wanted = track;
      if (!this.ctx || this.track === track) return;
      const { ctx, music } = this;
      if (!this.buffers.has(track)) this.buffers.set(track, makeLoop(ctx, scores[track]));
      const source = ctx.createBufferSource();
      const channel = ctx.createGain();
      source.buffer = this.buffers.get(track);
      source.loop = true;
      const now = ctx.currentTime;
      channel.gain.value = 0;
      source.connect(channel).connect(music);
      source.start();
      channel.gain.linearRampToValueAtTime(0.78, now + 0.28);
      source.onended = () => {
        source.disconnect();
        channel.disconnect();
      };
      if (this.current) {
        this.current.channel.gain.setTargetAtTime(0, now, 0.06);
        this.current.source.stop(now + 0.3);
      }
      this.current = { source, channel };
      this.track = track;
    }
    effect(action) {
      if (!this.ctx || this.ctx.state !== "running") return;
      for (const [i, midi] of (effects[action] || []).entries()) {
        const start = this.ctx.currentTime + 0.055 * i;
        const tone = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        tone.type = "triangle";
        tone.frequency.value = hz(midi);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(1e-3, start + 0.18);
        tone.connect(gain).connect(this.effects);
        tone.start(start);
        tone.stop(start + 0.19);
        tone.onended = () => {
          tone.disconnect();
          gain.disconnect();
        };
      }
    }
  };

  // src/app.js
  var app = document.querySelector("#app");
  var dialog = document.querySelector("#book");
  var title = document.querySelector("#book-title");
  var bookBody = document.querySelector("#book-body");
  var announcer = document.querySelector("#battle-announcer");
  var hints = setupHints(document.querySelector("#hint-panel"));
  var state = newFoodRun();
  var locked = false;
  var feedback = {};
  var cardChoice = null;
  var sound = new CanteenSound(document.querySelector("[data-sound]"));
  var icon = (id, css = "") => `<img class="pixel ${css}" src="./assets/${id}.png" alt="" draggable="false">`;
  var btn = (action, name, css = "", id = "") => `<button type="button" class="${css}" data-action="${action}" data-id="${id}">${name}</button>`;
  var meal = recipes.find((recipe) => recipe.id === "meal");
  function hintButton(id, label, text) {
    return `<button type="button" class="hint-toggle" data-hint-toggle
		aria-expanded="false" aria-describedby="${id}">${label}</button>
		<span id="${id}" hidden>${text}</span>`;
  }
  var hint = (id, label, text) => `<span class="hint-trigger" data-hint="${id}">${hintButton(id, label, text)}</span>`;
  function cardView(food2, { card, action, disabled = false, ready = [], canInterrupt = false } = {}) {
    const tag = action ? "button" : "article";
    const attr = action ? `type="button" data-action="${action}" data-id="${card?.id ?? food2.id}"` : "";
    const upgrade23 = card?.upgraded ? `<small class="upgrade">\u5347\u7EA7\u540E ${[card.damage && card.damage + " \u4F24\u5BB3", card.block && card.block + " \u62A4\u76FE"].filter(Boolean).join(" / ")}</small>` : "";
    const readyLabel = canInterrupt ? "\u53EF\u524A\u5F31\u84C4\u529B" : "\u53EF\u5408\u6210" + (ready.length > 1 ? " \xD7" + ready.length : "");
    const combo = ready.length ? `<span class="card-ready" title="${ready.map(({ name }) => name).join("\u3001")}">${readyLabel}</span>` : "";
    return `<${tag} class="food-card ${food2.group} ${combo ? "combo-ready" : ""}" ${attr} ${disabled ? 'aria-disabled="true"' : ""}>
		<span class="card-top"><span class="cost" aria-label="${food2.cost} \u884C\u52A8">${food2.cost}</span><span class="card-group">${groups[food2.group]}</span></span>
		<span class="card-art">${icon(food2.image)}</span>
		<span class="food-description"><span class="food-title"><strong>${card?.name ?? food2.name}</strong>${combo}</span><span class="effect">${food2.text}</span>
			${food2.detail ? `<span class="card-detail">${food2.detail}</span>` : ""}${upgrade23}</span>
	</${tag}>`;
  }
  function vitality(fighter, label, previous) {
    const hp = Math.max(0, fighter.currentHealth);
    const percent = (value) => 100 * Math.max(0, value) / fighter.maxHealth;
    const from = percent(previous ?? hp);
    const to = percent(hp);
    return `<div class="fighter-vitals">
		<div class="life">
			<div class="life-label"><span>\u8010\u529B</span><strong>${hp}<small> / ${fighter.maxHealth}</small></strong></div>
			<div class="life-track" role="meter" aria-label="${label}\u8010\u529B" aria-valuemin="0" aria-valuemax="${fighter.maxHealth}"
				aria-valuenow="${hp}" style="--life:${to}%;--life-before:${from}%"><span></span></div>
		</div>
		<div class="shield ${fighter.block > 0 ? "shield-active" : ""}" aria-label="${label}\u62A4\u76FE ${fighter.block}">
			<b>${fighter.block}</b><span>\u62A4\u76FE</span>
		</div>
	</div>`;
  }
  function energyView() {
    const { currentEnergy, maxEnergy } = state.player;
    const pips = Array.from({ length: maxEnergy }, (_, index) => `<i class="${index < currentEnergy ? "lit" : ""}"></i>`).join("");
    return `<div class="energy"><strong>${currentEnergy}</strong><span>\u884C\u52A8</span><div class="energy-pips" aria-hidden="true">${pips}</div></div>`;
  }
  function tableView() {
    const { table } = state;
    const recent = table.cards;
    const isOpening = nodeAt(state).id === "market" && state.round === 1;
    const didEndTurn = state.round > 1 && recent.length === 0;
    const notableEvent = state.combined || state.repeatTriggered || table.tactic || didEndTurn;
    const recipeNames = table.recipes.map((id) => recipes.find((recipe) => recipe.id === id).name);
    const mealMissing = meal.need.filter((group) => !table.groups.includes(group));
    const missingLabel = mealMissing.length && mealMissing.length < meal.need.length ? "\u4E09\u4EF6\u5957\u7F3A" + mealMissing.map((group) => groups[group]).join("\u3001") : "";
    const firstPlay = nodeAt(state).id === "market" && state.round === 1 && !recent.length;
    return `<section class="worktable ${state.combined ? "assembled" : ""}" aria-label="\u672C\u56DE\u5408\u5DE5\u4F5C\u53F0">
		<div class="table-title">${icon("crafting_table_top")}<h2>\u5DE5\u4F5C\u53F0</h2>
			${isOpening ? hint("hint-opening", "\u9996\u8F6E\u63D0\u793A", "\u8BD5\u8BD5\u70E4\u9A6C\u94C3\u85AF \u2192 \u719F\u9C91\u9C7C \u2192 \u80E1\u841D\u535C\u3002\u540C\u4E00\u56DE\u5408\u53EF\u4EE5\u4E00\u6B21\u5408\u6210\u4E24\u5957\u914D\u65B9\u3002") : ""}
			<button type="button" data-book="recipes">\u770B\u914D\u65B9</button></div>
		<div class="craft-row">
			<div class="craft-input">
				<div class="table-groups">${["staple", "protein", "plant", "water"].map((group) => `<span class="${table.groups.includes(group) ? "filled " + group : mealMissing.length === 1 && mealMissing[0] === group ? "needed" : ""}">${groups[group]}</span>`).join("")}</div>
				<div class="played-track" aria-label="\u672C\u56DE\u5408\u6253\u51FA\u7684\u724C">
					${recent.map((id) => {
      const food2 = foodById[id];
      return `<div class="played-card ${food2.group}">${icon(food2.image)}<span>${food2.name}</span></div>`;
    }).join("")}
					${Array.from({ length: Math.max(0, 3 - recent.length) }, () => '<span class="empty-slot" aria-hidden="true"></span>').join("")}
					${firstPlay ? '<span class="empty-table">\u4ECE\u624B\u724C\u9009\u4E00\u5F20</span>' : ""}
				</div>
			</div>
			<span class="craft-arrow" aria-hidden="true"></span>
			<div class="craft-output ${recipeNames.length ? "ready" : ""}">
				<span class="output-slot" aria-hidden="true">${recipeNames.length ? icon("mushroom_stew") : ""}</span>
				<div>${recipeNames.length ? `<div class="active-recipes" aria-label="\u5DF2\u5408\u6210">${recipeNames.map((name) => `<span>${name}</span>`).join("")}</div>` : '<span class="output-label">\u5F85\u5408\u6210</span>'}
					${missingLabel ? `<span class="recipe-gap">${missingLabel}</span>` : ""}</div>
			</div>
		</div>
		<p class="work-log">${notableEvent ? state.message : ""}</p>
	</section>`;
  }
  function supplyFeedback() {
    const { loss, blocked, guardGain, shieldBroken, comboCount } = feedback;
    const changes = [
      state.hit ? "\u654C\u65B9 \u2212" + state.hit : "",
      guardGain ? "\u62A4\u76FE +" + guardGain : "",
      shieldBroken ? "\u7834\u76FE" : "",
      comboCount ? "\u5408\u6210 " + comboCount + " \u9879" : "",
      loss ? "\u8010\u529B \u2212" + loss : "",
      blocked ? "\u6321\u4E0B " + blocked : ""
    ];
    return changes.filter(Boolean).join(" \xB7 ");
  }
  function turnControls(intent, down) {
    const damage = intent.damage ?? 0;
    const incoming = Math.max(0, damage - state.player.block);
    const forecast = incoming ? "\u9884\u8BA1\u53D7\u4F24 " + incoming : damage ? "\u53EF\u5168\u6321\u653B\u51FB" : "\u672C\u8F6E\u65E0\u653B\u51FB";
    const mightPlay = state.hand.some((card) => card.energy <= state.player.currentEnergy);
    return `<div class="turn-controls">
		${!down ? `<span class="turn-forecast ${incoming ? "exposed" : "covered"}">${forecast}</span>` : ""}
		${btn("end", "\u7ED3\u675F\u56DE\u5408", mightPlay ? "turn-button" : "primary")}
	</div>`;
  }
  var counterLabels = {
    variety: (goal) => "\u51FA " + goal + " \u7C7B\u4E3B\u98DF\u3001\u86CB\u767D\u98DF\u6750\u6216\u852C\u679C",
    guard: (goal) => "\u53E0\u5230 " + goal + " \u70B9\u62A4\u76FE",
    recipe: (goal) => "\u5408\u6210 " + goal + " \u9053\u914D\u65B9"
  };
  function counterView(counter2) {
    if (!counter2) return "";
    const { kind, target, progress, met, penalty, relief } = counter2;
    return `<div class="counter-strip ${met ? "counter-done" : ""}">
		<strong>${met ? "\u5DF2\u62C6\u62DB" : "\u62C6\u62DB\u6761\u4EF6"}</strong>
		<span>${counterLabels[kind](target)} <b>${progress}/${target}</b></span>
		<small>${met ? "\u672C\u51FB\u4F24\u5BB3 \u2212" + relief : "\u672A\u5B8C\u6210\u65F6\u4F24\u5BB3 +" + penalty}</small>
	</div>`;
  }
  function tacticalPanel(intent) {
    const choices = [
      ["dampen", "\u538B\u706B", "\u654C\u65B9\u4F24\u5BB3 \u22127"],
      ["crack", "\u53BB\u58F3", "\u73B0\u6709\u76FE \u221210 \xB7 \u9884\u544A\u76FE \u22126"],
      ["reserve", "\u7559\u724C", "\u7559\u4E00\u5F20\u5230\u4E0B\u56DE\u5408"],
      ["swap", "\u6362\u724C", "\u5F03\u4E00\u5F20\uFF0C\u518D\u6478\u4E00\u5F20"]
    ];
    const reserved = state.table.reserved;
    return `<section class="tactic-panel ${cardChoice ? "choosing" : ""}" aria-label="\u6218\u672F\u706B\u5019">
		<div class="tactic-title"><b>\u6218\u672F\u706B\u5019</b><span>\u672C\u573A\u5269 ${state.tacticsLeft} \u6B21 \xB7 \u6BCF\u56DE\u5408\u4E00\u6B21</span></div>
		<div class="tactic-buttons">${choices.map(([id, label, detail]) => `<button type="button" data-action="tactic" data-id="${id}"
			${!canUseTactic(state, id) ? "disabled" : ""} ${id === "reserve" || id === "swap" ? 'aria-pressed="' + (cardChoice === id) + '"' : ""}><strong>${cardChoice === id ? "\u53D6\u6D88" + label : label}</strong><small>${detail}</small></button>`).join("")}</div>
		${cardChoice ? '<p role="status">' + (cardChoice === "swap" ? "\u70B9\u4E00\u5F20\u624B\u724C\u5F03\u6389\uFF0C\u518D\u6478\u4E00\u5F20\u3002" : "\u70B9\u4E00\u5F20\u624B\u724C\uFF0C\u7559\u5230\u4E0B\u56DE\u5408\u3002") + "</p>" : ""}
		${reserved ? "<p>\u5DF2\u9884\u7559\uFF1A<b>" + reserved.name + "</b></p>" : ""}
		${!cardChoice && !reserved && intent.interrupt && !intent.interrupted ? "<p>\u5148\u8BD5\u7740\u5408\u6210\u914D\u65B9\uFF0C\u53EF\u4EE5\u628A\u706B\u5019\u7559\u5230\u66F4\u96BE\u7684\u4E00\u51FB\u3002</p>" : ""}
	</section>`;
  }
  function battle() {
    const { id, y } = nodeAt(state);
    const foe = foes[id];
    const place = waypoints[id];
    const enemy = enemyAt(state);
    const intent = intentFor(state);
    const changed = intent.damage - intent.baseDamage;
    const notes = [
      `<b class="${changed > 0 ? "warn" : changed < 0 ? "countered" : ""}">${intent.damage} \u4F24\u5BB3${changed ? ` <small>${changed > 0 ? "+" : ""}${changed}</small>` : ""}</b>`,
      intent.block ? `<b>${intent.block} \u62A4\u76FE</b>` : "",
      intent.interrupted ? '<b class="countered">\u84C4\u529B\u5DF2\u524A\u5F31</b>' : intent.interrupt ? '<b class="warn">\u5408\u6210\u53EF\u524A\u5F31 ' + intent.interrupt + "</b>" : "",
      intent.energyLoss ? '<b class="warn">\u4E0B\u56DE\u5408 \u22121 \u884C\u52A8</b>' : "",
      intent.drawLoss ? '<b class="warn">\u4E0B\u56DE\u5408 \u22121 \u62BD\u724C</b>' : ""
    ].join("");
    const down = enemy.currentHealth <= 0;
    const { loss, blocked, guardGain } = feedback;
    const steps = trail.length - 1;
    const pips = Array.from({ length: steps }, (_, i) => `<i class="${i + 1 < y ? "passed" : i + 1 === y ? "current" : ""}"></i>`).join("");
    const recent = supplyFeedback();
    return `<section class="arena encounter-${id} ${down ? "foe-down" : ""}" aria-label="\u5BF9\u6218">
		<header class="encounter-header">
			<div><p class="eyebrow encounter-position">\u7B2C ${y} / ${steps} \u7AD9 <span class="trail-pips" aria-hidden="true">${pips}</span></p><strong>${place.name}</strong></div>
			<span class="round-state">${state.challenge ? "\u6311\u6218 \xB7 " : ""}\u7B2C ${state.round} \u56DE\u5408 <b>${down ? "\u6218\u6597\u7ED3\u675F" : "\u4F60\u7684\u56DE\u5408"}</b></span>
		</header>
		<div class="battlefield">
			<div class="fighter player-side">
				<p class="fighter-name">\u8425\u5730\u65C5\u4EBA</p>
				<div class="fighter-art ${loss ? "struck" : ""} ${state.player.block ? "guarded" : ""}">
					${portrait("player")}
					${loss ? `<span class="hit" aria-hidden="true">\u2212${loss}</span>` : ""}
					${blocked ? `<span class="hit guard-hit" aria-hidden="true">\u6321\u4E0B ${blocked}</span>` : ""}
					${guardGain ? `<span class="hit guard-hit" aria-hidden="true">\u62A4\u76FE +${guardGain}</span>` : ""}
				</div>
				<div class="vitals">${vitality(state.player, "\u73A9\u5BB6", feedback.playerBefore)}</div>
			</div>
			<div class="fighter enemy-side">
				<h1 class="fighter-name">${foe.name}</h1>
				<div class="intent"><span class="intent-name">${intent.label}</span>${notes}
					${hint("hint-foe", "\u673A\u5236", foe.rule)}</div>
				<div class="fighter-art ${state.hit ? "struck" : ""}">
					${portrait(id, foe.image)}
					${state.hit ? `<span class="hit ${state.combined ? "combo-hit" : ""}" aria-hidden="true">\u2212${state.hit}</span>` : ""}
				</div>
				<div class="enemy-health">${vitality(enemy, foe.name, feedback.foeBefore)}</div>
			</div>
		</div>
		${down ? "" : counterView(intent.counter)}
		<p class="encounter-story">${place.enter}</p>
	</section>
	<div class="inventory-frame">${tableView()}${down ? "" : tacticalPanel(intent)}
	<section class="hand-panel">
		<div class="hand-header">${energyView()}<div class="pile-info"><h2>\u624B\u724C</h2>
			<small>\u62BD\u724C ${state.drawPile.length} \xB7 \u5F03\u724C ${state.discardPile.length}${state.exhaustPile.length ? ` \xB7 \u6D88\u8017 ${state.exhaustPile.length}` : ""}</small>
			<small class="pocket-vitals">\u8010\u529B ${state.player.currentHealth} \xB7 \u62A4\u76FE ${state.player.block}${state.table.cards.length ? ` \xB7 \u684C\u4E0A ${state.table.cards.length} \u5F20` : ""}</small></div>
			${turnControls(intent, down)}
			${recent ? `<small class="hand-feedback">${recent}</small>` : ""}
		</div>
		<div class="hand ${cardChoice ? "reserve-select" : ""}">${state.hand.map((card) => {
      const food2 = foodOf(card);
      const disabled = !cardChoice && card.energy > state.player.currentEnergy;
      return cardView(food2, {
        action: cardChoice || "play",
        card,
        disabled,
        ready: disabled || down || cardChoice ? [] : recipesForPlay(state.table, food2),
        canInterrupt: !!intent.interrupt && !intent.interrupted
      });
    }).join("") || "<p>\u624B\u724C\u5DF2\u6253\u5B8C\uFF0C\u53EF\u4EE5\u7ED3\u675F\u56DE\u5408\u3002</p>"}</div>
	</section></div>`;
  }
  function intro() {
    return `<section class="hero">
		<div class="hero-copy"><p class="eyebrow">\u708A\u706B\u8425\u5730 \xB7 \u81B3\u98DF\u5361\u724C\u8FDC\u5F81</p>
		<h1>\u65B9\u5757\u98DF\u5802</h1>
		<p class="hero-text">\u8425\u5730\u4ECA\u665A\u8FD8\u6CA1\u5F00\u996D\u3002\u5E26\u4E0A\u98DF\u6750\u724C\uFF0C\u95EF\u8FC7\u96C6\u5E02\u548C\u77FF\u9053\uFF0C\u628A\u4E00\u5957\u80FD\u642D\u5F97\u8D77\u6765\u7684\u665A\u9910\u5E26\u56DE\u7089\u706B\u8FB9\u3002</p>
		<div class="hero-actions">${btn("travel", "\u5F00\u5C40 \xB7 \u5BF9\u6218\u96F6\u98DF\u53F2\u83B1\u59C6", "primary", "market")}
			${btn("challenge", "\u6311\u6218\u8FDC\u5F81", "turn-button")}
			${hint("hint-how", "\u73A9\u6CD5", "\u5148\u770B\u5BF9\u624B\u9884\u544A\uFF0C\u518D\u70B9\u624B\u724C\u3002\u6309\u8981\u6C42\u51FA\u724C\u6216\u53E0\u76FE\u53EF\u4EE5\u62C6\u62DB\u3002\n\u6362\u724C\u3001\u7559\u724C\u3001\u538B\u706B\u548C\u53BB\u58F3\u5171\u7528\u6218\u672F\u706B\u5019\u3002")}</div>
		<p class="challenge-note">\u6311\u6218\u8FDC\u5F81\uFF1A\u654C\u4EBA\u66F4\u5F3A\uFF0C\u6BCF\u573A\u9650\u7528\u4E00\u6B21\u706B\u5019\uFF0C\u4F11\u606F\u56DE\u590D\u66F4\u5C11\u3002</p></div>
		<div class="hero-media" aria-hidden="true">
			<div class="hero-traveler">${portrait("player")}${icon("campfire", "hero-fire")}</div>
			<div class="hero-rations">${icon("baked_potato")}${icon("cooked_salmon")}${icon("carrot")}</div>
		</div>
	</section>`;
  }
  function reality(id) {
    const foe = foes[id];
    const [link, url] = sources[foe.source];
    return `<aside class="field-note"><span>\u56DE\u5230\u73B0\u5B9E</span><p>${foe.note}</p><a href="${url}" target="_blank" rel="noreferrer">${link}</a></aside>`;
  }
  function rewards() {
    const { id } = nodeAt(state);
    return `<section class="interlude"><p class="eyebrow">${waypoints[id].name} \xB7 \u8865\u7ED9\u7BB1</p><h1>\u6311\u4E00\u5F20\u5E26\u8D70</h1>
		<p>${waypoints[id].clear}</p>
		<div class="hand reward-hand">${state.rewards.map((key) => cardView(foodById[key], { action: "reward" })).join("")}</div>
		${btn("reward", "\u8DF3\u8FC7\u5956\u52B1", "quiet")}
		${reality(id)}</section>`;
  }
  function journeyMap() {
    const current2 = nodeAt(state).id;
    const available = accessibleNodes(state).map((node) => node.id);
    return `<ol class="journey-map" aria-label="\u8FDC\u5F81\u8DEF\u7EBF">${trail.map((floor, y) => {
      const record = state.dungeon.pathTaken.find(([_x, visitedFloor]) => visitedFloor === y);
      return `<li><span class="map-stop">${y ? "\u7B2C " + y + " \u7AD9" : "\u51FA\u53D1"}</span>
			<div class="map-nodes">${floor.map((node, x) => {
        const status = node.id === current2 ? "current" : record?.[0] === x ? "visited" : available.includes(node.id) ? "available" : "";
        return `<span class="map-node ${status}" ${status === "current" ? 'aria-current="step"' : ""}>
					${icon(foes[node.id]?.image ?? (node.id === "camp" ? "campfire" : "crafting_table_top"))}
					${waypoints[node.id].name}<small>${{ current: "\u5F53\u524D", visited: "\u5DF2\u8D70\u8FC7", available: "\u4E0B\u4E00\u7AD9\u53EF\u9009" }[status] ?? ""}</small></span>`;
      }).join("")}</div></li>`;
    }).join("")}</ol>`;
  }
  function route() {
    const previous = waypoints[nodeAt(state).id];
    return `<section class="interlude route-screen"><p class="eyebrow">${previous.name} \xB7 \u8010\u529B ${state.player.currentHealth} / ${state.player.maxHealth}</p><h1>\u4E0B\u4E00\u7AD9</h1>
		<div class="route-layout"><div class="choices">${accessibleNodes(state).map((node) => {
      const foe = foes[node.id];
      return btn("travel", `${icon(foe?.image ?? "campfire")}<strong>${foe?.name ?? node.name}</strong>
				<span>${foe?.track ?? "\u6062\u590D\u8010\u529B\u6216\u5347\u7EA7\u4E00\u5F20\u724C"}</span><small>${waypoints[node.id].name}</small>`, "choice", node.id);
    }).join("")}</div>${journeyMap()}</div></section>`;
  }
  function camp() {
    return `<section class="interlude"><p class="eyebrow">\u7B2C 4 \u7AD9</p><h1>\u7BDD\u706B\u8865\u7ED9</h1>
		<p>\u6062\u590D\u8010\u529B\uFF0C\u6216\u5347\u7EA7\u4E00\u5F20\u4F24\u5BB3\u724C / \u62A4\u76FE\u724C\u3002\u4E8C\u9009\u4E00\u3002</p>
		${btn("rest", "\u4F11\u606F \xB7 \u6062\u590D " + campRecovery(state.challenge) + " \u70B9\u8010\u529B", "primary")}
		<div class="hand reward-hand">${state.deck.filter((card) => !card.upgraded && (card.damage || card.block)).map((card) => cardView(foodOf(card), { card, action: "upgrade" })).join("")}</div></section>`;
  }
  function finalScreen() {
    const win = state.phase === "win";
    return `<section class="interlude"><p class="eyebrow">${win ? "\u95EF\u5173\u6210\u529F" : "\u8010\u529B\u8017\u5C3D"}</p>
		<h1>${win ? "\u665A\u9910\u5E26\u56DE\u6765\u4E86" : "\u56DE\u8425\u5730\u518D\u5907\u4E00\u9910"}</h1>
		<p>${win ? waypoints.boss.clear : `${waypoints[nodeAt(state).id].name}\u7684\u8DEF\u8FD8\u6CA1\u6253\u901A\u3002\u56DE\u53BB\u6362\u4E00\u4EFD\u98DF\u6750\u518D\u51FA\u53D1\u3002`}</p>
		<p>\u8FD9\u8D9F\u5B8C\u6210\u4E86 ${state.crafted} \u6B21\u914D\u65B9\u3001\u62C6\u4E86 ${state.countersCleared} \u62DB\uFF0C\u8FC7\u4E86 ${state.learned.length} \u573A\u5BF9\u6218\u3002</p>
		${btn("restart", "\u518D\u6765\u4E00\u5C40", "primary")}
		${win ? reality("boss") : ""}</section>`;
  }
  var views = { intro, fight: battle, reward: rewards, route, camp, win: finalScreen, lost: finalScreen };
  function render(phase = state.phase) {
    hints.close();
    app.innerHTML = views[phase]();
    sound.setScene(state.phase === "fight" ? nodeAt(state).id === "boss" ? enemyAt(state).currentHealth <= enemyAt(state).maxHealth / 2 ? "bossLate" : "boss" : "fight" : ["win", "lost"].includes(state.phase) ? state.phase : "camp");
  }
  function openBook(tab) {
    const pages = {
      recipes: ["\u914D\u65B9\u518C", `<p>\u540C\u4E00\u56DE\u5408\u5185\uFF0C\u6BCF\u6761\u914D\u65B9\u6700\u591A\u89E6\u53D1\u4E00\u6B21\u3002\u4E0D\u540C\u914D\u65B9\u53EF\u4EE5\u53E0\u52A0\u3002</p>
			<ol class="recipe-list">${recipes.map((recipe) => `<li><strong>${recipe.name}</strong><span>${recipe.text}</span><small>${recipe.result}</small></li>`).join("")}</ol>`],
      map: ["\u8865\u7ED9\u8DEF\u7EBF", journeyMap()],
      deck: ["\u724C\u5E93 \xB7 " + state.deck.length + " \u5F20", `<div class="hand book-deck">${state.deck.map((card) => cardView(foodOf(card), { card })).join("")}</div>`],
      sources: ["\u79D1\u666E\u4E0E\u7D20\u6750\u6765\u6E90", `<p>\u5361\u724C\u6570\u503C\u3001\u654C\u4EBA\u548C\u914D\u65B9\u4E3A\u6E38\u620F\u89C4\u5219\u3002\u901A\u5173\u4EE3\u8868\u5B8C\u6210\u6311\u6218\uFF0C\u73B0\u5B9E\u4E2D\u7684\u98CE\u9669\u4E0E\u5065\u5EB7\u7BA1\u7406\u9700\u6309\u4E13\u4E1A\u79D1\u666E\u8D44\u6599\u7406\u89E3\u3002</p>
			<ul class="source-list">${Object.values(sources).map(([name, url]) => `<li><a href="${url}" target="_blank" rel="noreferrer">${name}</a></li>`).join("")}
				<li><a href="https://github.com/oskarrough/slaytheweb" target="_blank" rel="noreferrer">Slay the Web \xB7 \u6218\u6597\u4E0E\u724C\u5806\u5F15\u64CE\uFF08AGPL-3.0-or-later\uFF09</a></li>
				<li><a href="https://github.com/PrismarineJS/minecraft-assets" target="_blank" rel="noreferrer">PrismarineJS \xB7 Minecraft Java 1.21.4 \u8D34\u56FE\u5B58\u6863</a></li>
				<li><a href="https://www.minecraft.net/en-us/usage-guidelines" target="_blank" rel="noreferrer">Minecraft \xB7 \u4F7F\u7528\u6307\u5357</a></li></ul>`]
    };
    const page = pages[tab];
    if (!page) return;
    title.textContent = page[0];
    bookBody.innerHTML = page[1];
    if (!dialog.open) dialog.showModal();
  }
  function focusNewScreen() {
    window.scrollTo(0, 0);
    const heading = app.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }
  function animatePlayedCard(flight) {
    const slot = app.querySelector(".played-card:last-of-type");
    if (slot) slot.parentElement.scrollLeft = slot.parentElement.scrollWidth;
    flyToTable(flight, slot);
  }
  function present(next, action, flight) {
    const previous = state;
    state = next;
    cardChoice = null;
    feedback = {};
    if (action === "play") {
      const after = intentFor(state);
      const before = intentFor(previous);
      const interrupted = after.interrupted && !before.interrupted || after.counter?.met && !before.counter?.met;
      sound.effect(interrupted ? "interrupt" : state.combined ? "recipe" : "play");
      const foeBefore = enemyAt(previous);
      feedback.foeBefore = foeBefore.currentHealth;
      feedback.guardGain = Math.max(0, state.player.block - previous.player.block);
      feedback.shieldBroken = foeBefore.block > 0 && enemyAt(state).block === 0;
      feedback.comboCount = state.table.recipes.length - previous.table.recipes.length;
      announcer.textContent = [
        state.message,
        state.hit ? "\u5BF9\u624B\u8010\u529B\u51CF\u5C11 " + state.hit : "",
        feedback.guardGain ? "\u4F60\u7684\u62A4\u76FE\u589E\u52A0 " + feedback.guardGain : ""
      ].filter(Boolean).join("\u3002");
    } else if (action === "tactic" || action === "reserve" || action === "swap") {
      sound.effect("tactic");
      announcer.textContent = state.message;
    } else if (action === "end") {
      feedback.playerBefore = previous.player.currentHealth;
      feedback.loss = Math.max(0, previous.player.currentHealth - state.player.currentHealth);
      feedback.blocked = Math.min(previous.player.block, intentFor(previous).damage);
      announcer.textContent = state.phase === "lost" ? "\u8010\u529B\u8017\u5C3D\u3002" : state.message + "\u7B2C " + state.round + " \u56DE\u5408\u3002";
    } else {
      if (action === "travel" || action === "reward" || action === "challenge") sound.effect(action === "challenge" ? "travel" : action);
      announcer.textContent = "";
    }
    if (flight && previous.phase === "fight" && (state.phase === "reward" || state.phase === "win")) {
      locked = true;
      render("fight");
      app.querySelector(".hand-panel").inert = true;
      animatePlayedCard(flight);
      window.setTimeout(() => {
        locked = false;
        render();
        focusNewScreen();
      }, 460);
      return;
    }
    render();
    if (previous.phase !== state.phase) {
      focusNewScreen();
      return;
    }
    if (action === "play") {
      animatePlayedCard(flight);
      const nextControl = app.querySelector('.hand [data-action="play"]:not([aria-disabled="true"])') ?? app.querySelector('[data-action="end"]');
      nextControl?.focus({ preventScroll: true });
    }
    if (action === "end") app.querySelector('[data-action="end"]')?.focus({ preventScroll: true });
  }
  function animateEnemyTurn(next) {
    sound.effect("enemy");
    if (reducedMotion()) {
      present(next, "end");
      return;
    }
    locked = true;
    hints.close();
    app.querySelector(".arena").classList.add("enemy-turn");
    app.querySelector(".round-state b").textContent = "\u5BF9\u624B\u884C\u52A8";
    const forecast = app.querySelector(".turn-forecast");
    if (forecast) {
      forecast.textContent = "\u6B63\u5728\u7ED3\u7B97";
      forecast.classList.remove("covered", "exposed");
    }
    announcer.textContent = "\u5BF9\u624B\u884C\u52A8\u3002";
    app.querySelector(".hand-panel").inert = true;
    window.setTimeout(() => {
      locked = false;
      present(next, "end");
    }, 290);
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-sound]")) {
      sound.toggle();
      return;
    }
    sound.unlock();
    const book = event.target.closest("[data-book]");
    if (book) openBook(book.dataset.book);
    const button = event.target.closest("[data-action]");
    if (!button || locked || button.getAttribute("aria-disabled") === "true") return;
    const { action, id } = button.dataset;
    if (action === "tactic" && (id === "reserve" || id === "swap")) {
      if (!canUseTactic(state, id)) return;
      cardChoice = cardChoice === id ? null : id;
      render();
      app.querySelector(cardChoice ? `[data-action="${cardChoice}"]` : `[data-action="tactic"][data-id="${id}"]`)?.focus({ preventScroll: true });
      return;
    }
    const transitions = {
      travel: () => travel(state, id),
      challenge: () => startChallenge(state),
      play: () => playFood(state, id),
      tactic: () => useTactic(state, id),
      reserve: () => useTactic(state, "reserve", id),
      swap: () => useTactic(state, "swap", id),
      end: () => finishTurn(state),
      reward: () => takeReward(state, id),
      rest: () => campChoice(state, "rest"),
      upgrade: () => campChoice(state, "upgrade", id),
      restart: newFoodRun
    };
    const next = transitions[action]?.();
    if (!next || next === state) return;
    if (action === "end") animateEnemyTurn(next);
    else present(next, action, action === "play" ? cardInMotion(button) : null);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  render();
})();
