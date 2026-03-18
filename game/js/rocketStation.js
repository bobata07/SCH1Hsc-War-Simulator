class RocketStation {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 120;
        this.health = this.maxHealth;
        this.cooldown = 0;
        this.fireRate = 220;
        this.markedForDeletion = false;
        this.projectiles = [];
        this.rocketSound = new Audio('assets/sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(enemyArtilleryUnits) {
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        if (this.cooldown <= 0) {
            const target = this.findTarget(enemyArtilleryUnits);
            if (target) {
                this.launch(target);
                this.cooldown = this.fireRate;
            }
        }
    }

    launch(target) {
        if (!target || target.markedForDeletion) return false;

        this.projectiles.push(new Projectile(this.x, this.y, target, 11, 70, '#ff5a36', 8));
        const rocketSound = this.rocketSound.cloneNode();
        rocketSound.currentTime = 0;
        rocketSound.play().catch(e => console.log("Audio play failed:", e));
        return true;
    }

    findTarget(enemyArtilleryUnits) {
        let closest = null;
        let minDist = Infinity;

        for (const target of enemyArtilleryUnits) {
            const dist = Math.hypot(target.x - this.x, target.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                closest = target;
            }
        }

        return closest;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(e => console.error("Sound error:", e));
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#5b677d';
        ctx.fillRect(this.x - 18, this.y - 18, 36, 36);
        ctx.fillStyle = '#d7dde8';
        ctx.fillRect(this.x - 6, this.y - 24, 12, 12);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 26, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 26, 36 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
