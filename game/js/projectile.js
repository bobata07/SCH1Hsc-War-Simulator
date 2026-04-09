class Projectile {
    constructor(x, y, target, speed = 5, damage = 10, color = 'yellow', radius = 5, effects = {}) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.radius = radius;
        this.instantHit = effects.instantHit || false;
        this.displayFrames = effects.displayFrames || 0;
        this.splashRadius = effects.splashRadius || 0;
        this.splashDamage = effects.splashDamage || damage;
        this.splashTargets = effects.splashTargets || [];
        this.markedForDeletion = false;

        if (this.instantHit && this.target && !this.target.markedForDeletion) {
            this.x = this.target.x;
            this.y = this.target.y;
            this.hitTarget();
            this.markedForDeletion = false;
        }
    }

    update() {
        if (this.instantHit) {
            if (this.displayFrames > 0) {
                this.displayFrames--;
            } else {
                this.markedForDeletion = true;
            }
            return;
        }

        if (!this.target || this.target.markedForDeletion) {
            this.markedForDeletion = true;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
            this.hitTarget();
            return;
        }

        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
    }

    hitTarget() {
        this.target.takeDamage(this.damage);
        this.applySplashDamage();
        this.markedForDeletion = !this.instantHit;
    }

    applySplashDamage() {
        if (!this.splashRadius || !this.splashTargets.length) return;

        for (const target of this.splashTargets) {
            if (!target || target === this.target || target.markedForDeletion) continue;

            const dist = Math.hypot(target.x - this.x, target.y - this.y);
            if (dist <= this.splashRadius) {
                target.takeDamage(this.splashDamage);
            }
        }
    }

    draw(ctx) {
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.1);
        glow.addColorStop(0, this.color);
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.25, this.y - this.radius * 0.25, Math.max(1.5, this.radius * 0.35), 0, Math.PI * 2);
        ctx.fill();
    }
}
