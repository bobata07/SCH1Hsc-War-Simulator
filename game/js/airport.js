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
        ctx.fillStyle = '#4d5661';
        ctx.fillRect(this.x - this.runwayWidth / 2, this.y - this.runwayHeight / 2, this.runwayWidth, this.runwayHeight);

        ctx.fillStyle = '#2d3338';
        ctx.fillRect(this.x - 14, this.y - 28, 28, 16);

        ctx.strokeStyle = '#dfe6ec';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 30, this.y);
        ctx.lineTo(this.x - 10, this.y);
        ctx.moveTo(this.x + 10, this.y);
        ctx.lineTo(this.x + 30, this.y);
        ctx.stroke();

        ctx.fillStyle = '#d4f0ff';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('AIRPORT', this.x, this.y + 32);
    }
}
