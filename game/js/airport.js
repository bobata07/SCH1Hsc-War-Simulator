class Airport {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.runwayWidth = 90;
        this.runwayHeight = 42;
    }

    containsPoint(x, y) {
        return (
            x >= this.x - this.runwayWidth / 2 &&
            x <= this.x + this.runwayWidth / 2 &&
            y >= this.y - this.runwayHeight / 2 &&
            y <= this.y + this.runwayHeight / 2
        );
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 26, this.runwayWidth * 0.58, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        const runway = ctx.createLinearGradient(this.x, this.y - this.runwayHeight / 2, this.x, this.y + this.runwayHeight / 2);
        runway.addColorStop(0, '#68717b');
        runway.addColorStop(1, '#3f464d');
        ctx.fillStyle = runway;
        ctx.beginPath();
        ctx.roundRect(this.x - this.runwayWidth / 2, this.y - this.runwayHeight / 2, this.runwayWidth, this.runwayHeight, 8);
        ctx.fill();

        ctx.fillStyle = '#2d3338';
        ctx.beginPath();
        ctx.roundRect(this.x - 16, this.y - 30, 32, 18, 5);
        ctx.fill();

        ctx.strokeStyle = '#dfe6ec';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 34, this.y);
        ctx.lineTo(this.x - 12, this.y);
        ctx.moveTo(this.x + 12, this.y);
        ctx.lineTo(this.x + 34, this.y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 16);
        ctx.lineTo(this.x, this.y + 16);
        ctx.stroke();

        ctx.fillStyle = '#a7d7ee';
        ctx.fillRect(this.x - 8, this.y - 26, 16, 6);

        ctx.fillStyle = '#d4f0ff';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('AIRPORT', this.x, this.y + 34);
    }
}
