class Artillery {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 460;
        this.cooldown = 0;
        this.fireRate = 160;
        this.maxHealth = 140;
        this.health = this.maxHealth;
        this.laserFrames = 0;
        this.laserTarget = null;
        this.color = '#8b7d6b';
        this.projectiles = [];
        this.markedForDeletion = false;
        this.shootSound = new Audio('assets/sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(enemies) {
        if (this.cooldown > 0) this.cooldown--;
        if (this.laserFrames > 0) this.laserFrames--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.shoot(target);
                this.cooldown = this.fireRate;
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
        this.laserTarget = { x: target.x, y: target.y };
        this.laserFrames = 8;
        this.projectiles.push(new Projectile(this.x, this.y, target, 8, 55, '#c97c1a', 7, {
            instantHit: true,
            displayFrames: 8
        }));
        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.play().catch(e => console.log("Audio play failed:", e));
    }

    distanceTo(target) {
        return Math.hypot(target.x - this.x, target.y - this.y);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(e => console.error("Sound error:", e));
        }
    }

    draw(ctx) {
        if (this.laserFrames > 0 && this.laserTarget) {
            ctx.strokeStyle = 'rgba(255, 120, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.laserTarget.x, this.laserTarget.y);
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

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 24, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 24, 36 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
