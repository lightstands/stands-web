import { Accessor, createSignal } from "solid-js";

type ScrollEventHandler = (ev: { target: Element }) => void;

type ScrollStatus = {
    scrolling: Accessor<boolean>;
    scrolled: Accessor<boolean>;
};

export default function (): [ScrollStatus, ScrollEventHandler] {
    let lastScrollTop = 0;
    const [isScrolling, setIsScrolling] = createSignal(false);
    const [isScrolled, setIsScrolled] = createSignal(false);

    const handleEvent = (ev: { target: Element }) => {
        setIsScrolled(ev.target.scrollTop !== 0);
        const scrollTop = Math.max(0, ev.target.scrollTop);
        const maxScrollTop = ev.target.scrollHeight - ev.target.clientHeight;
        if (scrollTop > lastScrollTop && scrollTop < maxScrollTop) {
            setIsScrolling(true);
        } else {
            setIsScrolling(false);
        }
        lastScrollTop = scrollTop;
    };

    return [{ scrolling: isScrolling, scrolled: isScrolled }, handleEvent];
}
