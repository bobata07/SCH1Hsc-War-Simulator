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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, 30, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        const shell = ctx.createLinearGradient(this.x, this.y - 18, this.x, this.y + 18);
        shell.addColorStop(0, '#69765a');
        shell.addColorStop(1, '#3c4633');
        ctx.fillStyle = shell;
        ctx.beginPath();
        ctx.roundRect(this.x - 24, this.y - 18, 48, 36, 10);
        ctx.fill();

        ctx.fillStyle = '#252d22';
        ctx.beginPath();
        ctx.roundRect(this.x - 14, this.y - 7, 28, 13, 4);
        ctx.fill();

        ctx.fillStyle = '#7f8a6d';
        ctx.fillRect(this.x - 26, this.y - 3, 52, 6);

        ctx.fillStyle = '#d6e4aa';
        ctx.beginPath();
        ctx.roundRect(this.x - 6, this.y - 28, 12, 16, 4);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 22, this.y - 28, 44, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 22, this.y - 28, 44 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
