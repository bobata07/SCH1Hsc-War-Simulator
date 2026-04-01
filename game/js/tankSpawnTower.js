class TankSpawnTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnCooldown = 0;
        this.spawnRate = 1000;
        this.color = '#7a6740';
        this.spawnIndex = 0;
    }

    update(deltaTime, tanks, fieldWidth, fieldHeight) {
        this.spawnCooldown += deltaTime;

        if (this.spawnCooldown >= this.spawnRate) {
            const bounds = Soldier.getBattleBounds(fieldWidth, fieldHeight, 16);
            const availableUp = Math.max(0, this.y - bounds.top - 8);
            const availableDown = Math.max(0, bounds.bottom - this.y - 8);
            const verticalStep = Math.min(12, Math.max(availableUp, availableDown, 0));
            const laneOffsets = [
                0,
                Math.min(availableDown, verticalStep),
                -Math.min(availableUp, verticalStep)
            ];
            const spawnOffsetY = laneOffsets[this.spawnIndex % laneOffsets.length];
            const point = Soldier.clampPoint(this.x + 32, this.y + spawnOffsetY, fieldWidth, fieldHeight, 16);
            tanks.push(new Tank(point.x, point.y));
            this.spawnIndex++;
            this.spawnCooldown = 0;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = 'rgba(222, 200, 119, 0.16)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const baseGradient = ctx.createLinearGradient(this.x, this.y - 20, this.x, this.y + 20);
        baseGradient.addColorStop(0, '#8f7a4c');
        baseGradient.addColorStop(1, '#54442b');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.roundRect(this.x - 20, this.y - 20, 40, 40, 7);
        ctx.fill();

        ctx.fillStyle = '#d9c47f';
        ctx.beginPath();
        ctx.roundRect(this.x - 12, this.y - 28, 24, 12, 4);
        ctx.fill();

        ctx.fillStyle = '#43361f';
        ctx.fillRect(this.x - 14, this.y - 4, 28, 8);
        ctx.fillRect(this.x - 4, this.y - 10, 8, 20);

        ctx.strokeStyle = 'rgba(255, 240, 190, 0.22)';
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y + 10);
        ctx.lineTo(this.x + 12, this.y + 10);
        ctx.stroke();
    }
}
