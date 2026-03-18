class TankSpawnTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnCooldown = 0;
        this.spawnRate = 1000;
        this.color = '#7a6740';
    }

    update(deltaTime, tanks) {
        this.spawnCooldown += deltaTime;

        if (this.spawnCooldown >= this.spawnRate) {
            tanks.push(new Tank(this.x + 28, this.y));
            this.spawnCooldown = 0;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = 'rgba(193, 177, 92, 0.18)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);

        ctx.fillStyle = '#d9c47f';
        ctx.fillRect(this.x - 12, this.y - 26, 24, 12);
        ctx.fillRect(this.x - 4, this.y - 8, 8, 16);
    }
}
