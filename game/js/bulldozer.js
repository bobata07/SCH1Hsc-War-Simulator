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
        this.towingSpeed = 2.6;
        this.towedWreck = null;
        this.targetRepairBase = null;
    }

    update(radiationZones, tankWrecks, repairBases, fieldWidth, fieldHeight) {
        if (this.towedWreck && this.targetRepairBase) {
            this.moveToward(this.targetRepairBase.x, this.targetRepairBase.y, this.towingSpeed);
            this.towedWreck.x = this.x - 26;
            this.towedWreck.y = this.y + 10;

            if (Math.hypot(this.targetRepairBase.x - this.x, this.targetRepairBase.y - this.y) <= this.targetRepairBase.repairRadius) {
                this.towedWreck.markedForDeletion = true;
                const repairedTank = new Tank(this.targetRepairBase.x + 36, this.targetRepairBase.y, {
                    sourceTower: this.towedWreck.sourceTower
                });
                this.towedWreck = null;
                this.targetRepairBase = null;
                return repairedTank;
            }

            return null;
        }

        const targetWreck = this.findClosestWreck(tankWrecks);
        if (targetWreck && repairBases.length) {
            this.targetRepairBase = this.findClosestRepairBase(repairBases);

            if (!this.targetRepairBase) return null;

            this.moveToward(targetWreck.x, targetWreck.y, this.towingSpeed);
            if (Math.hypot(targetWreck.x - this.x, targetWreck.y - this.y) <= this.radius + targetWreck.radius) {
                targetWreck.assignedBulldozer = this;
                this.towedWreck = targetWreck;
            }
            return null;
        }

        const targetZone = this.findClosestZone(radiationZones);
        if (targetZone) {
            this.moveToward(targetZone.x, targetZone.y, this.moveSpeed);

            const dist = Math.hypot(targetZone.x - this.x, targetZone.y - this.y);
            if (dist <= targetZone.radius + this.radius * 0.35) {
                targetZone.duration -= this.cleanRate;
            }
        } else {
            const standbyX = Math.max(this.radius + 8, fieldWidth * 0.08);
            const standbyY = Math.max(this.radius + 8, Math.min(fieldHeight - this.radius - 8, fieldHeight * 0.86));
            this.moveToward(standbyX, standbyY, this.moveSpeed);
        }

        this.x = Math.max(this.radius, Math.min(fieldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(fieldHeight - this.radius, this.y));
        return null;
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

    findClosestWreck(tankWrecks) {
        let closest = null;
        let minDist = Infinity;

        for (const wreck of tankWrecks) {
            if (wreck.markedForDeletion || (wreck.assignedBulldozer && wreck.assignedBulldozer !== this)) continue;

            const dist = Math.hypot(wreck.x - this.x, wreck.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                closest = wreck;
            }
        }

        return closest;
    }

    findClosestRepairBase(repairBases) {
        let closest = null;
        let minDist = Infinity;

        for (const base of repairBases) {
            const dist = Math.hypot(base.x - this.x, base.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                closest = base;
            }
        }

        return closest;
    }

    moveToward(targetX, targetY, speed) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) return;

        this.x += (dx / dist) * speed;
        this.y += (dy / dist) * speed;
    }

    takeDamage() {
        // Bulldozers are immune to damage.
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 17, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const body = ctx.createLinearGradient(this.x, this.y - 14, this.x, this.y + 14);
        body.addColorStop(0, '#d0a754');
        body.addColorStop(1, '#89672a');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.roundRect(this.x - 22, this.y - 14, 44, 28, 6);
        ctx.fill();

        ctx.fillStyle = '#4f5b2a';
        ctx.beginPath();
        ctx.roundRect(this.x - 10, this.y - 22, 20, 12, 4);
        ctx.fill();

        ctx.fillStyle = '#40464d';
        ctx.fillRect(this.x - 18, this.y + 10, 12, 4);
        ctx.fillRect(this.x + 6, this.y + 10, 12, 4);
        ctx.fillRect(this.x + 18, this.y - 12, 14, 24);

        ctx.strokeStyle = '#d6bd6b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x + 30, this.y - 16);
        ctx.lineTo(this.x + 30, this.y + 16);
        ctx.moveTo(this.x + 22, this.y - 10);
        ctx.lineTo(this.x + 30, this.y - 16);
        ctx.moveTo(this.x + 22, this.y + 10);
        ctx.lineTo(this.x + 30, this.y + 16);
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 20, this.y - 26, 40, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 20, this.y - 26, 40, 4);
    }
}
