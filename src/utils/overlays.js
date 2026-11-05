// Modern top-layer dialog, popover, Temporal & form validation utilities

export async function initModernOverlays() {
  if (typeof window === 'undefined') return;

  // 0. Feature-detect Temporal API before importing polyfill & assign to globalThis explicitly
  if (typeof globalThis.Temporal === 'undefined') {
    const temporalMod = await import('temporal-polyfill');
    globalThis.Temporal = temporalMod.Temporal;
  }

  // 1. Feature-detect Popover API on HTMLElement.prototype before loading polyfill
  if (!('popover' in HTMLElement.prototype)) {
    import('@oddbird/popover-polyfill');
  }

  // 2. Light-dismiss fallback for browsers without native HTMLDialogElement.prototype.closedBy
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        if (e.target !== dialog) {
          pressedOutside = false;
          return;
        }
        pressedOutside = outside(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && e.target === dialog && outside(e, dialog)) {
          closeTopLayer(dialog);
        }
        pressedOutside = false;
      });
    }
  }

  // 3. Route cancel events through closeTopLayer & reset stale returnValue on close
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeTopLayer(dialog);
    });
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
    });
  }

  // 4. Sync aria-invalid with :user-invalid (and WeakMap fallback where :user-invalid is absent)
  initUserInvalidValidation(document);
}

let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
}

export async function closeTopLayer(element) {
  if (!element) return;
  const isPopover = element.hasAttribute('popover');
  const isOpen = isPopover
    ? element.matches(':popover-open, .\\:popover-open')
    : element.open;
  if (!isOpen) return;

  if (!supportsTopLayerExit()) {
    element.setAttribute('data-closing', '');
    const animations = element.getAnimations?.({ subtree: true }) || [];
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 400)),
      ]);
    }
    if (!element.hasAttribute('data-closing')) return;
    element.removeAttribute('data-closing');
  }

  if (isPopover) {
    element.hidePopover?.();
  } else {
    element.close?.();
  }
}

function initUserInvalidValidation(root) {
  const supportsNative = Boolean(window.CSS?.supports?.('selector(:user-invalid)'));

  const markSubmitInvalid = (form) => {
    for (const control of form?.elements || []) {
      if (!('validity' in control) || typeof control.checkValidity !== 'function') continue;
      const isValid = control.checkValidity();
      control.classList.toggle('user-invalid-fallback', !isValid);
      control.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    }
  };

  if (supportsNative) {
    const syncAria = (el) => {
      if (!el?.matches || !('validity' in el)) return;
      if (el.validity.valid) {
        el.classList.remove('user-invalid-fallback');
        el.setAttribute('aria-invalid', 'false');
        return;
      }
      const invalidNow = el.matches(':user-invalid') || el.classList.contains('user-invalid-fallback');
      el.setAttribute('aria-invalid', invalidNow ? 'true' : 'false');
    };
    root.addEventListener('blur', (e) => syncAria(e.target), true);
    root.addEventListener('change', (e) => syncAria(e.target));
    root.addEventListener('input', (e) => {
      if (e.target?.hasAttribute?.('aria-invalid') || e.target?.classList?.contains('user-invalid-fallback')) {
        syncAria(e.target);
      }
    });
    root.addEventListener('submit', (e) => {
      if (e.target instanceof HTMLFormElement && !e.target.checkValidity()) {
        markSubmitInvalid(e.target);
      }
    }, true);
    return;
  }

  const dirtyState = new WeakMap();
  const updateState = (input) => {
    const isValid = input.checkValidity();
    input.classList.toggle('user-invalid-fallback', !isValid);
    input.classList.toggle('user-valid-fallback', isValid);
    input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
  };

  const handleEvent = (event) => {
    const input = event.target;
    if (event.type === 'submit' && input instanceof HTMLFormElement) {
      if (!input.checkValidity()) markSubmitInvalid(input);
      return;
    }
    if (event.type === 'reset') {
      const controls = input.elements || [];
      for (const control of controls) {
        dirtyState.delete(control);
        control.classList.remove('user-invalid-fallback', 'user-valid-fallback');
        control.removeAttribute('aria-invalid');
      }
      return;
    }
    if (!input?.checkValidity) return;
    const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
    if (event.type === 'input' || event.type === 'change') {
      state.hasInteracted = true;
      dirtyState.set(input, state);
      if (state.hasBlurred || input.classList.contains('user-invalid-fallback')) updateState(input);
    } else if (event.type === 'blur') {
      state.hasBlurred = true;
      dirtyState.set(input, state);
      if (state.hasInteracted) updateState(input);
    }
  };

  root.addEventListener('blur', handleEvent, true);
  root.addEventListener('input', handleEvent);
  root.addEventListener('change', handleEvent);
  root.addEventListener('submit', handleEvent, true);
  root.addEventListener('reset', handleEvent, true);
}
