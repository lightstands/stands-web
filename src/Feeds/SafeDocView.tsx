import {
    Component,
    createEffect,
    createSignal,
    JSX,
    on,
    onCleanup,
    onMount,
} from "solid-js";
import { untrack } from "solid-js/web";

function makeUniqueId() {
    const n = Math.floor(Math.random() * 1000);
    return `safe-doc-view-${n.toString(16)}`;
}

interface SafeDocViewProps {
    srcdoc?: string;
    height: number | string;
    width: number | string;
    title?: string;
    style?: JSX.CSSProperties;
    onDocumentResize?: (size: { height: number; width: number }) => void;
}

const SafeDocView: Component<SafeDocViewProps> = (props) => {
    let el: HTMLIFrameElement;
    let currentObservedElement: HTMLElement | undefined;
    const [jumpExLink, setJumpExLink] = createSignal<string>();
    const elId = makeUniqueId();
    const docResizingOb = new ResizeObserver((entries) => {
        if (props.onDocumentResize) {
            const target = entries[0].target;
            const { scrollHeight, scrollWidth } = target as HTMLElement;
            props.onDocumentResize({
                width: scrollWidth,
                height: scrollHeight,
            });
        }
    });

    const onLinkClick = (ev: MouseEvent) => {
        ev.preventDefault();
        if (ev.target instanceof HTMLAnchorElement) {
            setJumpExLink(ev.target.href);
        } else {
            throw new Error("unreachable");
        }
    };

    createEffect(() => {
        const link = jumpExLink();
        if (link) {
            untrack(() => {
                setJumpExLink(undefined);
                if (window.confirm(`Open this link?\n\n${link}`)) {
                    window.open(link, "_blank");
                }
            });
        }
    });

    const onDocLoaded = () => {
        const docEl = el.contentDocument!.documentElement;
        for (const node of docEl.querySelectorAll("a")) {
            node.onclick = onLinkClick;
        }
        for (const node of docEl.querySelectorAll("img")) {
            // Rubicon: Taking note:
            // Browsers could not lazy load images unless JavaScript-enabled for privacy concern.
            // They are smart enough to acknowledge that JavaScript-disabled = "do not track me"!
            // FIXME: We need a workaround to load images lazily, or we may trigger the rate limit from different sites even in normal reading.
            // We may need a image proxy in future
            node.crossOrigin = "anonymous";
            node.style.width = "100%";
        }
        docEl.style.overflow = "hidden";
        if (currentObservedElement !== docEl) {
            if (currentObservedElement) {
                docResizingOb.unobserve(currentObservedElement);
            }
            docResizingOb.observe(docEl);
            currentObservedElement = docEl;
        }
    };

    onCleanup(() => {
        el.removeEventListener("load", onDocLoaded);
        if (currentObservedElement) {
            docResizingOb.unobserve(currentObservedElement);
            currentObservedElement = undefined;
        }
    });

    onMount(() => {
        el.addEventListener("load", onDocLoaded, {
            passive: true,
        });
    });

    return (
        <iframe
            ref={el!}
            srcdoc={props.srcdoc}
            title={props.title}
            sandbox="allow-same-origin"
            referrerpolicy="strict-origin"
            height={props.height}
            width={props.width}
            style={{ border: "0", ...props.style }}
            id={elId}
        >
            LightStands could not display your content, since your browser does
            not support.
        </iframe>
    );
};

export default SafeDocView;
