class SpawnTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnCooldown = 0;
        this.spawnRate = 1000;
        this.color = '#2e8b57';
    }

    update(deltaTime, soldiers, maxSoldiers) {
        this.spawnCooldown += deltaTime;

        if (this.spawnCooldown >= this.spawnRate && soldiers.length < maxSoldiers) {
            soldiers.push(new Soldier(this.x + 24, this.y));
            this.spawnCooldown = 0;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = 'rgba(46, 139, 87, 0.18)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 26, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 18, this.y - 18, 36, 36);

        ctx.fillStyle = '#d8ffd8';
        ctx.fillRect(this.x - 6, this.y - 24, 12, 10);
    }
}

