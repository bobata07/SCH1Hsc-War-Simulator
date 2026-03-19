class EnemyArtillery {
    constructor(width, height) {
        this.x = width - 80 - Math.random() * 120;
        this.y = 80 + Math.random() * Math.max(120, height - 160);
        this.range = 460;
        this.cooldown = 0;
        this.fireRate = 180;
        this.maxHealth = 140;
        this.health = this.maxHealth;
        this.laserFrames = 0;
        this.laserTarget = null;
        this.markedForDeletion = false;
        this.color = '#6f5f52';
        this.projectiles = [];
    }

    update(playerTargets) {
        if (this.cooldown > 0) this.cooldown--;
        if (this.laserFrames > 0) this.laserFrames--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        if (this.cooldown <= 0) {
            const target = this.findTarget(playerTargets);
            if (target) {
                this.shoot(target);
                this.cooldown = this.fireRate;
            }
        }
    }

    findTarget(playerTargets) {
        let closest = null;
        let minDist = Infinity;

        for (const target of playerTargets) {
            const dist = Math.hypot(target.x - this.x, target.y - this.y);
            if (dist < this.range && dist < minDist) {
                minDist = dist;
                closest = target;
            }
        }

        return closest;
    }

    shoot(target) {
        this.laserTarget = { x: target.x, y: target.y };
        this.laserFrames = 8;
        this.projectiles.push(new Projectile(this.x, this.y, target, 8, 45, '#d1512d', 7, {
            instantHit: true,
            displayFrames: 8
        }));
        const shotSound = new Audio(EnemyArtillery.currentSoundPath);
        shotSound.play().catch(() => {});
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        if (this.laserFrames > 0 && this.laserTarget) {
            ctx.strokeStyle = 'rgba(255, 80, 40, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.laserTarget.x, this.laserTarget.y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(209, 81, 45, 0.12)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 16, this.y - 12, 32, 24);
        ctx.fillStyle = '#301b14';
        ctx.fillRect(this.x - 5, this.y - 22, 10, 16);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 24, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 24, 36 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}

EnemyArtillery.currentSoundPath = 'assets/sounds/artillery sounds/cannon-sound-effect-hd-for-videos-and-games.mp3';

EnemyArtillery.setFireSound = function (soundPath) {
    EnemyArtillery.currentSoundPath = soundPath;
};

