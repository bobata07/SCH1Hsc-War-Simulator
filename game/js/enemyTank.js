class EnemyTank {
    constructor(width, height) {
        this.x = width - 60 - Math.random() * 90;
        this.y = 80 + Math.random() * Math.max(120, height - 160);
        this.maxHealth = 260;
        this.health = this.maxHealth;
        this.range = 180;
        this.visionRange = 1000;
        this.cooldown = 0;
        this.fireRate = 58;
        this.moveSpeed = 1.6;
        this.radius = 16;
        this.markedForDeletion = false;
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/artillery sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
        this.formationAngle = Math.random() * Math.PI * 2;
        this.formationDistance = 28 + Math.random() * 40;
        this.cruiseDrift = (Math.random() - 0.5) * 0.45;
    }

    update(playerTargets, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        const attackTarget = this.findTarget(playerTargets, this.visionRange);
        if (attackTarget) {
            const attackPoint = this.getAttackPoint(attackTarget);
            this.moveToward(attackPoint.x, attackPoint.y, this.range - 18);
        } else {
            this.x -= this.moveSpeed;
            this.y += this.cruiseDrift;
        }

        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(fieldHeight - this.radius, this.y));

        if (this.cooldown <= 0) {
            const shootTarget = this.findTarget(playerTargets, this.range);
            if (shootTarget) {
                this.shoot(shootTarget);
                this.cooldown = this.fireRate;
            }
        }
    }

    findTarget(targets, maxRange) {
        let closest = null;
        let minDist = Infinity;
        for (const target of targets) {
            const dist = Math.hypot(target.x - this.x, target.y - this.y);
            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = target;
            }
        }
        return closest;
    }

    moveToward(targetX, targetY, stopDistance = 0) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= stopDistance || dist === 0) return;
        const travel = Math.min(this.moveSpeed, dist - stopDistance);
        this.x += (dx / dist) * travel;
        this.y += (dy / dist) * travel;
    }

    getAttackPoint(target) {
        return {
            x: target.x + Math.cos(this.formationAngle) * this.formationDistance,
            y: target.y + Math.sin(this.formationAngle) * this.formationDistance
        };
    }

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target, 9, 28, '#d1764b', 6));
        this.shootSound.cloneNode().play().catch(() => {});
    }

    takeDamage(amount) {
        this.health -= amount * 0.7;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 14, 24, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7b4a32';
        ctx.beginPath();
        ctx.roundRect(this.x - 20, this.y - 12, 40, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#4b2c1f';
        ctx.fillRect(this.x - 14, this.y + 10, 10, 4);
        ctx.fillRect(this.x + 4, this.y + 10, 10, 4);
        ctx.fillStyle = '#d18b62';
        ctx.beginPath();
        ctx.roundRect(this.x - 7, this.y - 22, 14, 18, 5);
        ctx.fill();
        ctx.fillStyle = '#7f4f38';
        ctx.fillRect(this.x - 23, this.y - 15, 18, 4);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 24, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 24, 36 * (this.health / this.maxHealth), 4);
        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
