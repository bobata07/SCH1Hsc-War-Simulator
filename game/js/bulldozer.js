class Bulldozer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 340;
        this.health = this.maxHealth;
        this.radius = 18;
        this.moveSpeed = 1.8;
        this.markedForDeletion = false;
        this.cruiseDrift = (Math.random() - 0.5) * 0.35;
        this.cleanRate = 260;
    }

    update(radiationZones, fieldWidth, fieldHeight) {
        const targetZone = this.findClosestZone(radiationZones);

        if (targetZone) {
            this.moveToward(targetZone.x, targetZone.y);

            const dist = Math.hypot(targetZone.x - this.x, targetZone.y - this.y);
            if (dist <= targetZone.radius + this.radius * 0.35) {
                targetZone.duration -= this.cleanRate;
            }
        } else {
            this.x += this.moveSpeed;
            this.y += this.cruiseDrift;
        }

        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(fieldHeight - this.radius, this.y));
    }

    findClosestZone(radiationZones) {
        let closest = null;
        let minDist = Infinity;

        for (const zone of radiationZones) {
            const dist = Math.hypot(zone.x - this.x, zone.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                closest = zone;
            }
        }

        return closest;
    }

    moveToward(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) return;

        this.x += (dx / dist) * this.moveSpeed;
        this.y += (dy / dist) * this.moveSpeed;
    }

    takeDamage(amount) {
        this.health -= amount * 0.65;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(e => console.error("Sound error:", e));
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#b68d3c';
        ctx.fillRect(this.x - 22, this.y - 14, 44, 28);

        ctx.fillStyle = '#4f5b2a';
        ctx.fillRect(this.x - 10, this.y - 22, 20, 12);

        ctx.fillStyle = '#5f6770';
        ctx.fillRect(this.x + 18, this.y - 12, 14, 24);

        ctx.strokeStyle = '#d6bd6b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x + 30, this.y - 16);
        ctx.lineTo(this.x + 30, this.y + 16);
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 20, this.y - 26, 40, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 20, this.y - 26, 40 * (this.health / this.maxHealth), 4);
    }
}
