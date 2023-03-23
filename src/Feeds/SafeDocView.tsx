import {
    Component,
    createSignal,
    createUniqueId,
    JSX,
    onCleanup,
    onMount,
} from "solid-js";
import { UAParser } from "ua-parser-js";

import UrlOpenConfirm from "./UrlOpenConfirm";

import innerDocStyle from "./inner-doc.css?inline";

function hasProperty<X extends {}, K extends PropertyKey>(
    o: X,
    k: K
): o is X & Record<K, unknown> {
    return k in o;
}

interface SafeDocViewProps {
    srcdoc?: string;
    height: number | string;
    width: number | string;
    title?: string;
    style?: JSX.CSSProperties;
    onDocumentResize?: (size: { height: number; width: number }) => void;
}

function iframeProcessingBlockedBySandbox() {
    const parser = UAParser();
    return parser.engine.name === "WebKit";
}

const SafeDocView: Component<SafeDocViewProps> = (props) => {
    let el: HTMLIFrameElement;
    let currentObservedElement: HTMLElement | undefined;
    const [jumpExLink, setJumpExLink] = createSignal<string>();
    const elId = createUniqueId();
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
        if (
            ev.target &&
            hasProperty(ev.target, "href") &&
            typeof ev.target.href === "string"
        ) {
            setJumpExLink(ev.target.href);
        } else {
            throw new Error("unreachable");
        }
    };

    const onDOMLoaded = () => {
        const doc = el.contentDocument!;
        const docEl = doc.documentElement;
        let head = docEl.querySelector("head");
        if (!head) {
            head = doc.createElement("head");
            docEl.appendChild(head);
        }
        const globalStyle = el.contentDocument!.createElement("style");
        head.appendChild(globalStyle);
        globalStyle.textContent = innerDocStyle;
        const imgs = docEl.querySelectorAll("img");
        for (const node of imgs) {
            node.loading = "lazy";
            node.crossOrigin = "anonymous";
        }
        if (docEl.querySelector("pre code .token")) {
            // inject prism.js styles
            import("../assets/prism.css?inline").then((prismCss) => {
                const prismStyle = doc.createElement("style");
                head!.appendChild(prismStyle);
                prismStyle.id = "prism-js-style";
                prismStyle.textContent = prismCss.default;
            });
        }
    };

    const waitForDOMLoaded = () => {
        const wait = () => {
            if (el.contentDocument?.documentElement) {
                onDOMLoaded();
            } else {
                setTimeout(wait, 0);
            }
        };
        setTimeout(wait, 0);
    };

    const onDocLoaded = () => {
        const docEl = el.contentDocument!.documentElement;
        docEl.style.overflow = "hidden";
        for (const node of docEl.querySelectorAll("a")) {
            node.onclick = onLinkClick;
        }
        if (currentObservedElement !== docEl) {
            if (currentObservedElement) {
                docResizingOb.unobserve(currentObservedElement);
            }
            docResizingOb.observe(docEl);
            currentObservedElement = docEl;
        }
    };

    const sandboxOptions = () => {
        if (!iframeProcessingBlockedBySandbox()) {
            return "allow-same-origin";
        } else {
            // Safari blocks script execution without allow-scripts even if allow-same-origin is set.
            // For example, any bound handlers for click events of nodes inside an iframe throw an error for blocked script execution.
            // Chrome <= 70 does the same, see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#browser_compatibility
            // We have sanitized the html when the server software fetched the content. So security here might be just fine,
            // but allow these two make me feels sick. (Rubicon)
            return "allow-same-origin allow-scripts";
        }
    };

    onCleanup(() => {
        el.contentWindow!.removeEventListener("pagehide", waitForDOMLoaded);
        if (currentObservedElement) {
            docResizingOb.unobserve(currentObservedElement);
            currentObservedElement = undefined;
        }
    });

    onMount(() => {
        el.contentWindow!.addEventListener("pagehide", waitForDOMLoaded, {
            passive: true,
        });
    });

    return (
        <>
            <UrlOpenConfirm
                url={jumpExLink()}
                onClose={() => setJumpExLink()}
            />
            <iframe
                ref={el!}
                srcdoc={props.srcdoc}
                title={props.title}
                sandbox={/* @once */ sandboxOptions()}
                referrerpolicy="strict-origin"
                height={props.height}
                width={props.width}
                style={{ border: "0", ...props.style }}
                id={elId}
                onLoad={onDocLoaded}
            >
                LightStands could not display your content, since your browser
                does not support.
            </iframe>
        </>
    );
};

export default SafeDocView;
