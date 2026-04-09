class AirDefense {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 180;
        this.health = this.maxHealth;
        this.radarRange = 600;
        this.cooldown = 0;
        this.fireRate = 52;
        this.markedForDeletion = false;
        this.projectiles = [];
        this.radarSweep = Math.random() * Math.PI * 2;
        this.launchSound = new Audio('assets/sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(hostileUnits) {
        if (this.cooldown > 0) this.cooldown--;
        this.radarSweep += 0.055;

        this.projectiles.forEach(projectile => {
            projectile.splashTargets = hostileUnits;
        });
        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        if (this.cooldown <= 0) {
            const target = this.findTarget(hostileUnits);
            if (target) {
                this.launch(target);
                this.cooldown = this.fireRate;
            }
        }
    }

    findTarget(hostileUnits) {
        let closest = null;
        let minDist = Infinity;

        for (const unit of hostileUnits) {
            if (!unit || unit.markedForDeletion) continue;

            const dist = Math.hypot(unit.x - this.x, unit.y - this.y);
            if (dist <= this.radarRange && dist < minDist) {
                minDist = dist;
                closest = unit;
            }
        }

        return closest;
    }

    launch(target) {
        if (!target || target.markedForDeletion) return false;

        this.projectiles.push(new Projectile(this.x, this.y - 12, target, 14, 110, '#ff784f', 7, {
            splashRadius: 72,
            splashDamage: 110
        }));
        const launchSound = this.launchSound.cloneNode();
        launchSound.currentTime = 0;
        launchSound.play().catch(() => {});
        return true;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        const radarOpacity = 0.14 + ((Math.sin(this.radarSweep * 2) + 1) * 0.04);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, 28, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(110, 255, 183, ${radarOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radarRange, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(110, 255, 183, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radarRange * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(140, 255, 200, 0.42)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x + Math.cos(this.radarSweep) * this.radarRange,
            this.y + Math.sin(this.radarSweep) * this.radarRange
        );
        ctx.stroke();

        const baseGradient = ctx.createLinearGradient(this.x, this.y - 18, this.x, this.y + 20);
        baseGradient.addColorStop(0, '#7d8791');
        baseGradient.addColorStop(1, '#39434f');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.roundRect(this.x - 20, this.y - 16, 40, 36, 7);
        ctx.fill();

        ctx.fillStyle = '#25303b';
        ctx.beginPath();
        ctx.roundRect(this.x - 10, this.y - 28, 20, 20, 5);
        ctx.fill();

        ctx.strokeStyle = '#9effc4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 27, 11, Math.PI, 0);
        ctx.stroke();

        ctx.strokeStyle = '#1f242c';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.x - 14, this.y - 6);
        ctx.lineTo(this.x + 16, this.y - 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y - 2);
        ctx.lineTo(this.x + 22, this.y - 11);
        ctx.stroke();

        ctx.fillStyle = '#d9e2ec';
        ctx.beginPath();
        ctx.roundRect(this.x - 14, this.y + 2, 28, 9, 4);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 25, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 25, 36 * (this.health / this.maxHealth), 4);

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
