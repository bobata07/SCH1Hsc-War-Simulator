

class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 150;
        this.cooldown = 0;
        this.fireRate = 30; // Frames between shots
        this.color = 'blue';
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
    }

    update(enemies) {
        // Cooldown
        if (this.cooldown > 0) this.cooldown--;

        // Projectiles
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        // Targeting
        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.shoot(target);
                this.cooldown = this.fireRate;
            }
        }
    }

    findTarget(enemies) {
        // Simple closest target logic
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.range && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }
        return closest;
    }

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target));
        this.shootSound.cloneNode().play().catch(() => {});
    }

    draw(ctx) {
        ctx.strokeStyle = 'rgba(205, 224, 235, 0.08)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 18, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const baseGradient = ctx.createLinearGradient(this.x, this.y - 16, this.x, this.y + 18);
        baseGradient.addColorStop(0, '#93a4ae');
        baseGradient.addColorStop(1, '#48555d');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.roundRect(this.x - 16, this.y - 14, 32, 28, 6);
        ctx.fill();

        ctx.fillStyle = '#30414b';
        ctx.beginPath();
        ctx.roundRect(this.x - 11, this.y - 9, 22, 18, 5);
        ctx.fill();

        ctx.fillStyle = '#1d272d';
        ctx.fillRect(this.x + 4, this.y - 4, 18, 6);

        ctx.fillStyle = '#c6d6de';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y + 2);
        ctx.lineTo(this.x + 12, this.y + 2);
        ctx.stroke();

        this.projectiles.forEach(p => p.draw(ctx));
    }
}
