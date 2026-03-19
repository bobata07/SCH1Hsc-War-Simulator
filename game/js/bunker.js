class Bunker {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 260;
        this.cooldown = 0;
        this.fireRate = 18;
        this.maxHealth = 520;
        this.health = this.maxHealth;
        this.healPerSecond = 26;
        this.coverRadius = 26;
        this.markedForDeletion = false;
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
    }

    update(enemies, soldiers, deltaTime) {
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        soldiers.forEach(soldier => {
            const dist = Math.hypot(soldier.x - this.x, soldier.y - this.y);
            if (dist <= this.coverRadius) {
                soldier.health = Math.min(soldier.maxHealth, soldier.health + this.healPerSecond * (deltaTime / 1000));
            }
        });

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
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < this.range && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }

        return closest;
    }

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target, 9, 16, '#d4dca1', 4));
        this.shootSound.cloneNode().play().catch(() => {});
    }

    takeDamage(amount) {
        this.health -= amount * 0.15;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        ctx.strokeStyle = 'rgba(210, 220, 180, 0.12)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4f5940';
        ctx.fillRect(this.x - 24, this.y - 18, 48, 36);
        ctx.fillStyle = '#2d3325';
        ctx.fillRect(this.x - 12, this.y - 8, 24, 12);
        ctx.fillStyle = '#d6e4aa';
        ctx.fillRect(this.x - 5, this.y - 26, 10, 16);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 22, this.y - 28, 44, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 22, this.y - 28, 44 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}

