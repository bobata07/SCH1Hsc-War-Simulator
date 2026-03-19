class Sniper {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 320;
        this.cooldown = 0;
        this.fireRate = 120;
        this.aimFrames = 18;
        this.aimCountdown = 0;
        this.target = null;
        this.maxHealth = 90;
        this.health = this.maxHealth;
        this.color = 'orange';
        this.projectiles = [];
        this.markedForDeletion = false;
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
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
        this.projectiles.push(new Projectile(this.x, this.y, target, 12, 35, 'orange', 4));
        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.play().catch(() => {});
        this.target = null;
    }

    distanceTo(target) {
        return Math.hypot(target.x - this.x, target.y - this.y);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        if (this.aimCountdown > 0 && this.target && !this.target.markedForDeletion) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255, 165, 0, 0.12)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 15, this.y - 24, 30, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 15, this.y - 24, 30 * (this.health / this.maxHealth), 4);

        ctx.fillStyle = '#5b2d00';
        ctx.fillRect(this.x - 4, this.y - 18, 8, 14);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}

