class KamikazeTrain {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 180;
        this.health = this.maxHealth;
        this.width = 78;
        this.height = 24;
        this.radius = 22;
        this.moveSpeed = 4.6;
        this.turnSpeed = 2.2;
        this.visionRange = 540;
        this.triggerRadius = 30;
        this.blastRadius = 120;
        this.blastDamage = 240;
        this.markedForDeletion = false;
        this.exploded = false;
        this.explosionFrames = 0;
        this.smokePhase = Math.random() * Math.PI * 2;
        this.cruiseY = y;
        this.explosionSound = new Audio('assets/sounds/artillery sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(enemies, fieldWidth, fieldHeight) {
        if (this.exploded) {
            this.explosionFrames--;
            if (this.explosionFrames <= 0) {
                this.markedForDeletion = true;
            }
            return;
        }

        this.smokePhase += 0.18;

        const target = this.findTarget(enemies, this.visionRange);
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= this.triggerRadius + this.getTargetRadius(target)) {
                this.explode(enemies);
                return;
            }

            this.x += Math.max(this.moveSpeed * 0.92, (dx / Math.max(dist, 1)) * this.moveSpeed);

            const verticalStep = Math.sign(dy) * Math.min(Math.abs(dy), this.turnSpeed);
            this.y += verticalStep;
        } else {
            this.x += this.moveSpeed;
            this.y += Math.sin(this.smokePhase) * 0.35;
        }

        this.x = Math.max(this.width / 2, Math.min(fieldWidth + this.width, this.x));
        this.y = Math.max(this.height / 2, Math.min(fieldHeight - this.height / 2, this.y));

        if (this.x > fieldWidth + this.width * 0.75) {
            this.markedForDeletion = true;
        }
    }

    findTarget(enemies, maxRange) {
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy || enemy.markedForDeletion) continue;

            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }

        return closest;
    }

    getTargetRadius(target) {
        if (typeof target.radius === 'number') return target.radius;
        if (typeof target.width === 'number' && typeof target.height === 'number') {
            return Math.max(target.width, target.height) * 0.35;
        }
        return 18;
    }

    explode(enemies) {
        if (this.exploded) return;

        this.exploded = true;
        this.explosionFrames = 18;

        for (const enemy of enemies) {
            if (!enemy || enemy.markedForDeletion) continue;

            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist > this.blastRadius) continue;

            const falloff = Math.max(0.35, 1 - (dist / this.blastRadius));
            enemy.takeDamage(this.blastDamage * falloff);
        }

        const blast = this.explosionSound.cloneNode();
        blast.currentTime = 0;
        blast.play().catch(() => {});
    }

    takeDamage(amount) {
        if (this.exploded) return;

        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        if (this.exploded) {
            const pulse = 0.9 + (Math.sin(this.explosionFrames) * 0.08);

            ctx.fillStyle = 'rgba(255, 183, 0, 0.32)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.blastRadius * 0.72 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 88, 36, 0.52)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.blastRadius * 0.42 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 242, 180, 0.95)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.blastRadius * 0.16 * pulse, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        const smokeOffset = Math.sin(this.smokePhase) * 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x - this.width / 2 + 4, this.y + 16, this.width - 8, 8);

        ctx.fillStyle = '#5d1616';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        ctx.fillStyle = '#8f2929';
        ctx.fillRect(this.x - this.width / 2 + 8, this.y - this.height / 2 - 12, 22, 12);

        ctx.fillStyle = '#d2b66d';
        ctx.fillRect(this.x - this.width / 2 - 6, this.y + this.height / 2 - 4, this.width + 12, 5);

        ctx.strokeStyle = '#35210d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2 - 8, this.y + this.height / 2 + 4);
        ctx.lineTo(this.x + this.width / 2 + 8, this.y + this.height / 2 + 4);
        ctx.stroke();

        ctx.fillStyle = 'rgba(70, 70, 70, 0.75)';
        ctx.beginPath();
        ctx.arc(this.x - 12, this.y - 24 + smokeOffset, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 32 + smokeOffset * 0.8, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 24, this.y - 26, 48, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 24, this.y - 26, 48 * (this.health / this.maxHealth), 4);
    }
}
