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
        rocketSound.play().catch(() => {});
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
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 19, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const base = ctx.createLinearGradient(this.x, this.y - 18, this.x, this.y + 18);
        base.addColorStop(0, '#79849a');
        base.addColorStop(1, '#465066');
        ctx.fillStyle = base;
        ctx.beginPath();
        ctx.roundRect(this.x - 18, this.y - 18, 36, 36, 7);
        ctx.fill();

        ctx.fillStyle = '#d7dde8';
        ctx.beginPath();
        ctx.roundRect(this.x - 6, this.y - 25, 12, 13, 4);
        ctx.fill();

        ctx.fillStyle = '#2d3546';
        ctx.fillRect(this.x - 12, this.y - 6, 24, 8);
        ctx.fillRect(this.x + 3, this.y - 13, 14, 4);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 26, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 26, 36 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
