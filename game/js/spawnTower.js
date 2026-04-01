class SpawnTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnCooldown = 0;
        this.spawnRate = 1000;
        this.color = '#2e8b57';
        this.spawnIndex = 0;
    }

    update(deltaTime, soldiers, maxSoldiers, fieldWidth, fieldHeight) {
        this.spawnCooldown += deltaTime;

        if (this.spawnCooldown >= this.spawnRate && soldiers.length < maxSoldiers) {
            const bounds = Soldier.getBattleBounds(fieldWidth, fieldHeight, 10);
            const availableUp = Math.max(0, this.y - bounds.top - 6);
            const availableDown = Math.max(0, bounds.bottom - this.y - 6);
            const verticalStep = Math.min(14, Math.max(availableUp, availableDown, 0));
            const laneOffsets = [
                0,
                Math.min(availableDown, verticalStep),
                -Math.min(availableUp, verticalStep),
                Math.min(availableDown, verticalStep * 2),
                -Math.min(availableUp, verticalStep * 2)
            ];
            const spawnOffsetY = laneOffsets[this.spawnIndex % laneOffsets.length];
            const point = Soldier.clampPoint(this.x + 28, this.y + spawnOffsetY, fieldWidth, fieldHeight, 10);
            soldiers.push(new Soldier(point.x, point.y));
            this.spawnIndex++;
            this.spawnCooldown = 0;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = 'rgba(146, 224, 170, 0.14)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 26, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 18, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const wallGradient = ctx.createLinearGradient(this.x, this.y - 18, this.x, this.y + 18);
        wallGradient.addColorStop(0, '#5f8c68');
        wallGradient.addColorStop(1, '#2f5038');
        ctx.fillStyle = wallGradient;
        ctx.beginPath();
        ctx.roundRect(this.x - 18, this.y - 18, 36, 36, 7);
        ctx.fill();

        ctx.fillStyle = '#243229';
        ctx.beginPath();
        ctx.roundRect(this.x - 9, this.y - 4, 18, 14, 4);
        ctx.fill();

        ctx.fillStyle = '#d8ffd8';
        ctx.beginPath();
        ctx.roundRect(this.x - 6, this.y - 26, 12, 10, 3);
        ctx.fill();

        ctx.strokeStyle = 'rgba(220, 245, 228, 0.28)';
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 10);
        ctx.lineTo(this.x + 12, this.y - 10);
        ctx.moveTo(this.x - 12, this.y + 2);
        ctx.lineTo(this.x + 12, this.y + 2);
        ctx.stroke();
    }
}
