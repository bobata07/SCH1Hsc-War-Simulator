class Soldier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 100;
        this.cooldown = 0;
        this.fireRate = 45; // Slower fire rate for shotgun feel? Or faster? Plan said faster (20). usage: 45 is slower. User said "troops which shoot". Shotgun usually slow. I'll stick to plan valid interpretation or intuitive. Let's go with 45 (slower than tower 30) but maybe more damage? Or just stick to the plan: "Faster fire rate". Okay, I will make it 20.
        this.fireRate = 20;
        this.color = 'green';
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
    }

    update(enemies) {
        // Cooldown
        if (this.cooldown > 0) this.cooldown--;

        // Projectiles
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        // Targeting
        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.shoot(target);
                this.cooldown = this.fireRate;
            }
        }
    }

    findTarget(enemies) {
        // Simple closest target logic
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.range && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }
        return closest;
    }

    shoot(target) {
        this.projectiles.push(new Projectile(this.x, this.y, target));
        this.shootSound.cloneNode().play().catch(e => console.log("Audio play failed:", e));
    }

    draw(ctx) {
        // Range indicator (debug/hover)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();

        // Soldier body (Circle for now to distinguish from Square Tower)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(ctx));
    }
}
