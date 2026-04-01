class EnemyPlane {
    constructor(width, height) {
        this.x = width - 40;
        this.y = 90 + Math.random() * Math.max(100, height - 180);
        this.maxHealth = 120;
        this.health = this.maxHealth;
        this.radius = 16;
        this.range = 140;
        this.visionRange = 520;
        this.cooldown = 0;
        this.fireRate = 26;
        this.moveSpeed = 4.5;
        this.altitude = 0;
        this.targetAltitude = 80;
        this.state = 'taking-off';
        this.markedForDeletion = false;
        this.projectiles = [];
        this.wingPhase = Math.random() * Math.PI * 2;
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
    }

    update(playerTargets, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;
        this.wingPhase += 0.2;
        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

        if (this.state === 'taking-off') {
            this.x -= this.moveSpeed * 0.9;
            this.altitude = Math.min(this.targetAltitude, this.altitude + 3);
            if (this.altitude >= this.targetAltitude) this.state = 'airborne';
        } else {
            const target = this.findTarget(playerTargets, this.visionRange);
            if (target) {
                this.flyToward(target.x, target.y - 60);
                if (this.cooldown <= 0 && this.distanceTo(target) <= this.range) {
                    this.shoot(target);
                    this.cooldown = this.fireRate;
                }
            } else {
                this.x -= this.moveSpeed;
                this.y += Math.sin(this.wingPhase) * 0.8;
            }
        }

        if (this.x < -this.radius) this.x = fieldWidth + this.radius;
        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(fieldHeight - this.radius, this.y));
    }

    findTarget(targets, maxRange) {
        let closest = null;
        let minDist = Infinity;
        for (const target of targets) {
            const dist = this.distanceTo(target);
            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = target;
            }
        }
        return closest;
    }

    flyToward(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return;
        this.x += (dx / dist) * this.moveSpeed;
        this.y += (dy / dist) * this.moveSpeed;
    }

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target, 10, 18, '#ffb27d', 4));
        this.shootSound.cloneNode().play().catch(() => {});
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
        const bob = Math.sin(this.wingPhase) * 2;
        const drawY = this.y - this.altitude * 0.35 + bob;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 14, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f0c6b1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 20, drawY);
        ctx.lineTo(this.x + 20, drawY);
        ctx.moveTo(this.x + 8, drawY - 7);
        ctx.lineTo(this.x - 6, drawY + 7);
        ctx.stroke();
        ctx.fillStyle = '#9c6a58';
        ctx.beginPath();
        ctx.ellipse(this.x, drawY, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d9b29e';
        ctx.beginPath();
        ctx.roundRect(this.x - 4, drawY - 10, 8, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#633e32';
        ctx.fillRect(this.x - 20, drawY - 2, 12, 3);
        ctx.fillStyle = '#fff1ea';
        ctx.beginPath();
        ctx.arc(this.x + 2, drawY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, drawY - 20, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, drawY - 20, 36 * (this.health / this.maxHealth), 4);
        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }
}
