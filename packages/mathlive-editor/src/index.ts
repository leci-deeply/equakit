import {
  Fragment,
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type {
  FormulaInputEditorHandle,
  FormulaInputEditorProps,
  FormulaPaletteKey,
} from '@equakit/react-formula-input';
import type { MathfieldElement, VirtualKeyboardPolicy } from 'mathlive';

export interface MathLiveEditorAdapterOptions {
  virtualKeyboardPolicy?: VirtualKeyboardPolicy;
  smartFence?: boolean;
  popoverPolicy?: 'auto' | 'off';
  fontsDirectory?: string | null;
  soundsDirectory?: string | null;
  onReady?: (mathfield: MathfieldElement) => void;
  onLoadError?: (error: unknown) => void;
}

type LoadStatus = 'loading' | 'ready' | 'error';

export function createMathLiveFormulaEditor(options: MathLiveEditorAdapterOptions = {}) {
  return forwardRef<FormulaInputEditorHandle, FormulaInputEditorProps>(
    function MathLiveFormulaEditor(
      { value, onChange, ariaLabel, className, disabled, placeholder },
      ref,
    ) {
      const hostRef = useRef<HTMLDivElement>(null);
      const mathfieldRef = useRef<MathfieldElement | null>(null);
      const queuedSnippetsRef = useRef<FormulaPaletteKey[]>([]);
      const propsRef = useRef({ value, onChange, ariaLabel, className, disabled, placeholder });
      const [status, setStatus] = useState<LoadStatus>('loading');
      propsRef.current = { value, onChange, ariaLabel, className, disabled, placeholder };

      useImperativeHandle(
        ref,
        () => ({
          focus() {
            mathfieldRef.current?.focus();
          },
          insertSnippet(key) {
            const mathfield = mathfieldRef.current;
            if (!mathfield) {
              queuedSnippetsRef.current.push(key);
              return;
            }
            insertSnippet(mathfield, key);
            propsRef.current.onChange(mathfield.value);
          },
        }),
        [],
      );

      useEffect(() => {
        let disposed = false;
        let mountedMathfield: MathfieldElement | null = null;
        let removeInputListener: (() => void) | null = null;

        async function mountMathfield() {
          try {
            const { MathfieldElement } = await import('mathlive');
            if (disposed || !hostRef.current) return;
            if ('fontsDirectory' in options) {
              MathfieldElement.fontsDirectory = options.fontsDirectory ?? null;
            }
            if ('soundsDirectory' in options) {
              MathfieldElement.soundsDirectory = options.soundsDirectory ?? null;
            }

            const mathfield = new MathfieldElement();
            mountedMathfield = mathfield;
            mathfieldRef.current = mathfield;
            configureMathfield(mathfield, propsRef.current, options);
            mathfield.setValue(propsRef.current.value, { silenceNotifications: true });

            const handleInput = () => {
              propsRef.current.onChange(mathfield.value);
            };
            mathfield.addEventListener('input', handleInput);
            removeInputListener = () => mathfield.removeEventListener('input', handleInput);
            hostRef.current.replaceChildren(mathfield);
            repairMathfieldAccessibility(mathfield, propsRef.current.ariaLabel);

            for (const key of queuedSnippetsRef.current.splice(0)) {
              insertSnippet(mathfield, key);
            }
            if (mathfield.value !== propsRef.current.value) {
              propsRef.current.onChange(mathfield.value);
            }

            setStatus('ready');
            options.onReady?.(mathfield);
          } catch (error: unknown) {
            if (disposed) return;
            setStatus('error');
            options.onLoadError?.(error);
          }
        }

        void mountMathfield();

        return () => {
          disposed = true;
          removeInputListener?.();
          if (mathfieldRef.current === mountedMathfield) mathfieldRef.current = null;
          mountedMathfield?.remove();
        };
      }, []);

      useEffect(() => {
        const mathfield = mathfieldRef.current;
        if (!mathfield || status !== 'ready') return;
        configureMathfield(mathfield, propsRef.current, options);
        if (mathfield.value !== value) {
          mathfield.setValue(value, { silenceNotifications: true });
        }
      }, [ariaLabel, className, disabled, placeholder, status, value]);

      return createElement(
        Fragment,
        null,
        createElement('div', {
          'aria-busy': status === 'loading' ? true : undefined,
          'data-equakit-mathlive-host': 'true',
          ref: hostRef,
        }),
        status === 'error'
          ? createElement(
              'span',
              { className: 'mre-formula-input__error', role: 'alert' },
              'MathLive 数学输入器加载失败。',
            )
          : null,
      );
    },
  );
}

function configureMathfield(
  mathfield: MathfieldElement,
  props: Pick<FormulaInputEditorProps, 'ariaLabel' | 'className' | 'disabled' | 'placeholder'>,
  options: MathLiveEditorAdapterOptions,
) {
  mathfield.className = props.className;
  mathfield.setAttribute('aria-label', props.ariaLabel);
  mathfield.disabled = props.disabled;
  mathfield.placeholder = props.placeholder;
  mathfield.mathVirtualKeyboardPolicy = options.virtualKeyboardPolicy ?? 'auto';
  mathfield.smartFence = options.smartFence ?? true;
  mathfield.popoverPolicy = options.popoverPolicy ?? 'auto';
  repairMathfieldAccessibility(mathfield, props.ariaLabel);
}

function repairMathfieldAccessibility(mathfield: MathfieldElement, ariaLabel: string) {
  mathfield.setAttribute('role', 'group');
  mathfield.setAttribute('aria-label', ariaLabel);
  mathfield.removeAttribute('contenteditable');
  mathfield.removeAttribute('tabindex');

  const keyboardSink = mathfield.shadowRoot?.querySelector<HTMLElement>('[part~="keyboard-sink"]');
  keyboardSink?.setAttribute('aria-label', ariaLabel);
}

function insertSnippet(mathfield: MathfieldElement, key: FormulaPaletteKey) {
  mathfield.insert(key.insert, {
    feedback: false,
    focus: true,
    format: 'latex',
    insertionMode: 'replaceSelection',
    selectionMode: 'placeholder',
  });
}

export const MathLiveFormulaEditor = createMathLiveFormulaEditor({ soundsDirectory: null });
