class InputHandler {
    constructor() {
        this.keys = new Set();
        this.mouse = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.lastKeyChar = '';
        this.wheelDelta = 0;

        // Event bindings
        window.addEventListener('keydown', e => this.keys.add(e.key));
        window.addEventListener('keyup', e => this.keys.delete(e.key));
        window.addEventListener('keypress', e => {
            this.lastKeyChar = e.key;
        });
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);
        window.addEventListener('wheel', e => {
            this.wheelDelta = e.deltaY;
        }, { passive: true });
        window.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            if (!touch) return;
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
            this.isMouseDown = true;
        }, { passive: true });
        window.addEventListener('touchmove', e => {
            const touch = e.touches[0];
            if (!touch) return;
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
        }, { passive: true });
        window.addEventListener('touchend', () => {
            this.isMouseDown = false;
        }, { passive: true });

        // Prevent context menu to allow right-click usage if needed, or just track it
        window.addEventListener('contextmenu', e => {
            e.preventDefault();
            // dispatch custom event or handle logic
        });
    }

    isKeyPressed(key) {
        return this.keys.has(key);
    }
}

