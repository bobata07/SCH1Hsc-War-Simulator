class TankWreck {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.sourceTower = options.sourceTower || null;
        this.radius = 16;
        this.markedForDeletion = false;
        this.assignedBulldozer = null;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.26)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 14, 24, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4b4438';
        ctx.beginPath();
        ctx.roundRect(this.x - 20, this.y - 12, 40, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#2f2a24';
        ctx.beginPath();
        ctx.roundRect(this.x - 7, this.y - 22, 14, 14, 4);
        ctx.fill();
        ctx.fillStyle = '#1f1b18';
        ctx.fillRect(this.x - 14, this.y + 9, 10, 4);
        ctx.fillRect(this.x + 4, this.y + 9, 10, 4);

        ctx.strokeStyle = 'rgba(255, 110, 70, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 10);
        ctx.lineTo(this.x + 8, this.y + 2);
        ctx.moveTo(this.x - 2, this.y - 4);
        ctx.lineTo(this.x + 12, this.y + 10);
        ctx.stroke();
    }
}
