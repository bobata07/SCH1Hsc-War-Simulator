class InputHandler {
    constructor() {
        this.keys = new Set();
        this.mouse = { x: 0, y: 0 };
        this.isMouseDown = false;

        // Event bindings
        window.addEventListener('keydown', e => this.keys.add(e.key));
        window.addEventListener('keyup', e => this.keys.delete(e.key));
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);

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
