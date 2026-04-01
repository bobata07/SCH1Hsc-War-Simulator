class Trench {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 24;
        this.slowMultiplier = 0.4;
        this.damagePerSecond = 6;
    }

    affects(enemy) {
        const left = this.x - this.width / 2;
        const right = this.x + this.width / 2;
        const top = this.y - this.height / 2;
        const bottom = this.y + this.height / 2;

        return (
            enemy.x + enemy.radius >= left &&
            enemy.x - enemy.radius <= right &&
            enemy.y + enemy.radius >= top &&
            enemy.y - enemy.radius <= bottom
        );
    }

    applyEffect(enemy, deltaTime) {
        if (!this.affects(enemy)) return;

        enemy.moveSpeed = Math.min(enemy.moveSpeed, enemy.baseMoveSpeed * this.slowMultiplier);
        enemy.takeDamage(this.damagePerSecond * (deltaTime / 1000));
    }

    draw(ctx) {
        ctx.fillStyle = '#7f6441';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        ctx.fillStyle = '#342113';
        ctx.fillRect(this.x - this.width / 2 + 6, this.y - this.height / 2 + 4, this.width - 12, this.height - 8);

        ctx.strokeStyle = '#2b1b10';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        ctx.strokeStyle = '#a9885e';
        for (let i = -24; i <= 24; i += 12) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y - 10);
            ctx.lineTo(this.x + i, this.y + 10);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.stroke();
    }
}
