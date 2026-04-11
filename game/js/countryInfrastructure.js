class CountryInfrastructure {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width = config.width || 42;
        this.height = config.height || 42;
        this.label = config.label || 'Site';
        this.baseColor = config.baseColor || '#5b6a4a';
        this.accentColor = config.accentColor || '#c9d17e';
        this.shadowColor = config.shadowColor || 'rgba(0, 0, 0, 0.26)';
        this.ratePerSecond = config.ratePerSecond || 0;
        this.resourceType = config.resourceType || null;
    }

    update(deltaTime, game) {
        if (!this.resourceType || !this.ratePerSecond) return;
        game.countryResources[this.resourceType] += this.ratePerSecond * (deltaTime / 1000);
    }

    draw(ctx) {
        ctx.fillStyle = this.shadowColor;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height * 0.42, this.width * 0.45, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.roundRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 7);
        ctx.fill();

        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.roundRect(this.x - this.width * 0.28, this.y - this.height * 0.36, this.width * 0.56, this.height * 0.24, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(this.x - this.width * 0.22, this.y - 2, this.width * 0.44, 4);

        ctx.fillStyle = '#ecf3d6';
        ctx.font = '10px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y + this.height * 0.82);
    }
}

class OilInfrastructure extends CountryInfrastructure {
    constructor(x, y) {
        super(x, y, {
            label: 'Oil',
            baseColor: '#3b3f47',
            accentColor: '#d8ba62',
            resourceType: 'oil',
            ratePerSecond: 2.4
        });
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = '#d8ba62';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 8);
        ctx.lineTo(this.x + 10, this.y - 18);
        ctx.lineTo(this.x + 16, this.y + 6);
        ctx.stroke();
    }
}

class IronMine extends CountryInfrastructure {
    constructor(x, y) {
        super(x, y, {
            label: 'Iron',
            baseColor: '#4d514f',
            accentColor: '#9fc0c9',
            resourceType: 'iron',
            ratePerSecond: 2
        });
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = '#a9bcc2';
        ctx.beginPath();
        ctx.moveTo(this.x - 9, this.y + 4);
        ctx.lineTo(this.x - 1, this.y - 12);
        ctx.lineTo(this.x + 9, this.y + 4);
        ctx.closePath();
        ctx.fill();
    }
}

class Farm extends CountryInfrastructure {
    constructor(x, y) {
        super(x, y, {
            label: 'Food',
            baseColor: '#61733a',
            accentColor: '#e2d87d',
            resourceType: 'food',
            ratePerSecond: 2.8
        });
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = '#e2d87d';
        ctx.lineWidth = 2;
        for (let i = -8; i <= 8; i += 8) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y + 8);
            ctx.lineTo(this.x + i, this.y - 12);
            ctx.stroke();
        }
    }
}

class TankFactory extends CountryInfrastructure {
    constructor(x, y) {
        super(x, y, {
            label: 'Factory',
            width: 50,
            height: 46,
            baseColor: '#49515b',
            accentColor: '#d27d55'
        });

        this.spawnCooldown = 0;
        this.spawnRate = 9000;
        this.spawnIndex = 0;
        this.resourceCost = {
            oil: 18,
            iron: 24,
            food: 10
        };
    }

    canProduce(game) {
        return game.countryResources.oil >= this.resourceCost.oil
            && game.countryResources.iron >= this.resourceCost.iron
            && game.countryResources.food >= this.resourceCost.food
            && game.tanks.length < game.maxFriendlyTanks;
    }

    update(deltaTime, game, fieldWidth, fieldHeight) {
        this.spawnCooldown += deltaTime;
        if (this.spawnCooldown < this.spawnRate || !this.canProduce(game)) return;

        game.countryResources.oil -= this.resourceCost.oil;
        game.countryResources.iron -= this.resourceCost.iron;
        game.countryResources.food -= this.resourceCost.food;

        const laneOffsets = [0, 18, -18, 30, -30];
        const spawnOffsetY = laneOffsets[this.spawnIndex % laneOffsets.length];
        const point = Soldier.clampPoint(this.x + 34, this.y + spawnOffsetY, fieldWidth, fieldHeight, 16);
        game.tanks.push(new Tank(point.x, point.y));
        this.spawnIndex++;
        this.spawnCooldown = 0;
        game.updateHUD();
    }

    draw(ctx) {
        super.draw(ctx);

        ctx.fillStyle = '#2a2f35';
        ctx.fillRect(this.x - 15, this.y - 10, 8, 18);
        ctx.fillRect(this.x - 2, this.y - 16, 8, 24);
        ctx.fillRect(this.x + 11, this.y - 8, 8, 16);

        const progress = Math.min(1, this.spawnCooldown / this.spawnRate);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - 16, this.y - 29, 32, 4);
        ctx.fillStyle = '#f2a65a';
        ctx.fillRect(this.x - 16, this.y - 29, 32 * progress, 4);
    }
}
