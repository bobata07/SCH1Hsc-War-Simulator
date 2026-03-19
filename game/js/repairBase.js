class RepairBase {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.repairRadius = 44;
        this.capacity = 50;
        this.assignedTanks = new Set();
    }

    canAcceptTank(tank) {
        return this.assignedTanks.has(tank) || this.assignedTanks.size < this.capacity;
    }

    assignTank(tank) {
        if (!this.canAcceptTank(tank)) return false;
        this.assignedTanks.add(tank);
        return true;
    }

    releaseTank(tank) {
        this.assignedTanks.delete(tank);
    }

    draw(ctx) {
        ctx.strokeStyle = 'rgba(120, 220, 255, 0.24)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.repairRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#456a78';
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);

        ctx.fillStyle = '#d0f6ff';
        ctx.fillRect(this.x - 5, this.y - 14, 10, 28);
        ctx.fillRect(this.x - 14, this.y - 5, 28, 10);

        ctx.fillStyle = '#e8fbff';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.assignedTanks.size}/${this.capacity}`, this.x, this.y + 34);
    }
}

