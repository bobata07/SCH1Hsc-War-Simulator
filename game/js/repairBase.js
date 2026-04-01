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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 21, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const shell = ctx.createLinearGradient(this.x, this.y - 20, this.x, this.y + 20);
        shell.addColorStop(0, '#5f8ea0');
        shell.addColorStop(1, '#355362');
        ctx.fillStyle = shell;
        ctx.beginPath();
        ctx.roundRect(this.x - 20, this.y - 20, 40, 40, 8);
        ctx.fill();

        ctx.fillStyle = '#d0f6ff';
        ctx.beginPath();
        ctx.roundRect(this.x - 6, this.y - 15, 12, 30, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(this.x - 15, this.y - 6, 30, 12, 4);
        ctx.fill();

        ctx.fillStyle = '#8ad9ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e8fbff';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.assignedTanks.size}/${this.capacity}`, this.x, this.y + 34);
    }
}
