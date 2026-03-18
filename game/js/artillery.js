class Artillery {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 460;
        this.cooldown = 0;
        this.fireRate = 160;
        this.aimFrames = 28;
        this.aimCountdown = 0;
        this.target = null;
        this.color = '#8b7d6b';
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(enemies) {
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        if (this.aimCountdown > 0) {
            if (!this.target || this.target.markedForDeletion || this.distanceTo(this.target) > this.range) {
                this.aimCountdown = 0;
                this.target = null;
                return;
            }

            this.aimCountdown--;
            if (this.aimCountdown === 0) {
                this.shoot(this.target);
                this.cooldown = this.fireRate;
            }
            return;
        }

        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.target = target;
                this.aimCountdown = this.aimFrames;
            }
        }
    }

    findTarget(enemies) {
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dist = this.distanceTo(enemy);
            if (dist < this.range && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }

        return closest;
    }

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target, 8, 55, '#c97c1a', 6));
        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.play().catch(e => console.log("Audio play failed:", e));
        this.target = null;
    }

    distanceTo(target) {
        return Math.hypot(target.x - this.x, target.y - this.y);
    }

    draw(ctx) {
        if (this.aimCountdown > 0 && this.target && !this.target.markedForDeletion) {
            ctx.strokeStyle = 'rgba(255, 120, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(201, 124, 26, 0.12)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 16, this.y - 12, 32, 24);
        ctx.fillStyle = '#4a4339';
        ctx.fillRect(this.x - 5, this.y - 22, 10, 16);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
