class SupplyCrate {
    constructor(fieldWidth, fieldHeight) {
        this.radius = 18;
        this.x = 80 + Math.random() * Math.max(120, fieldWidth - 160);
        this.y = 110 + Math.random() * Math.max(120, fieldHeight - 190);
        this.goldValue = 120;
        this.lifetime = 12000;
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.markedForDeletion = true;
        }
    }

    containsPoint(x, y) {
        return Math.hypot(x - this.x, y - this.y) <= this.radius;
    }

    draw(ctx) {
        const pulse = 1 + Math.sin(performance.now() / 180) * 0.08;

        ctx.fillStyle = 'rgba(255, 213, 74, 0.18)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.8 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 14, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        const crate = ctx.createLinearGradient(this.x, this.y - 12, this.x, this.y + 12);
        crate.addColorStop(0, '#a36c35');
        crate.addColorStop(1, '#6e451f');
        ctx.fillStyle = crate;
        ctx.beginPath();
        ctx.roundRect(this.x - 16, this.y - 12, 32, 24, 4);
        ctx.fill();

        ctx.strokeStyle = '#f6d04d';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 16, this.y - 12, 32, 24);

        ctx.fillStyle = '#f6d04d';
        ctx.fillRect(this.x - 3, this.y - 12, 6, 24);
        ctx.fillRect(this.x - 16, this.y - 3, 32, 6);

        ctx.fillStyle = '#fff7bf';
        ctx.font = 'bold 14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('+120', this.x, this.y - 22);
    }
}
