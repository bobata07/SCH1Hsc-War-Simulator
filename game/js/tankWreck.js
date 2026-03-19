class TankWreck {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.markedForDeletion = false;
        this.assignedBulldozer = null;
    }

    draw(ctx) {
        ctx.fillStyle = '#4b4438';
        ctx.fillRect(this.x - 20, this.y - 12, 40, 24);
        ctx.fillStyle = '#2f2a24';
        ctx.fillRect(this.x - 6, this.y - 22, 12, 14);

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
