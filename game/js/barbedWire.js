class BarbedWire {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 28;
        this.damagePerSecond = 28;
    }

    damageEnemy(enemy, deltaTime) {
        const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (distance <= this.radius + enemy.radius) {
            enemy.takeDamage(this.damagePerSecond * (deltaTime / 1000));
        }
    }

    draw(ctx) {
        ctx.strokeStyle = '#b9b9b9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = -18; i <= 18; i += 9) {
            ctx.beginPath();
            ctx.moveTo(this.x - 20, this.y + i);
            ctx.lineTo(this.x + 20, this.y - i);
            ctx.stroke();
        }
    }
}

