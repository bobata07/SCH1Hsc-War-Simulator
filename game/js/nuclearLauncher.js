class NuclearLauncher {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 180;
        this.health = this.maxHealth;
        this.markedForDeletion = false;
        this.missiles = [];
        this.launchSound = new Audio('assets/sounds/artillery sounds/3-minutes-of-wwii-german-flak-88-firing(1).mp3');
        this.impactSound = new Audio('assets/sounds/artillery sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(onDetonate) {
        this.missiles.forEach(missile => {
            const dx = missile.targetX - missile.x;
            const dy = missile.targetY - missile.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= missile.speed) {
                missile.x = missile.targetX;
                missile.y = missile.targetY;
                missile.markedForDeletion = true;
                const impactSound = this.impactSound.cloneNode();
                impactSound.play().catch(() => {});
                onDetonate(missile.targetX, missile.targetY);
                return;
            }

            missile.x += (dx / dist) * missile.speed;
            missile.y += (dy / dist) * missile.speed;
        });

        this.missiles = this.missiles.filter(missile => !missile.markedForDeletion);
    }

    launchAt(targetX, targetY) {
        this.missiles.push({
            x: this.x,
            y: this.y,
            targetX,
            targetY,
            speed: 7,
            markedForDeletion: false
        });

        const launchSound = this.launchSound.cloneNode();
        launchSound.currentTime = 0;
        launchSound.play().catch(() => {});
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, 26, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        const silo = ctx.createLinearGradient(this.x, this.y - 20, this.x, this.y + 20);
        silo.addColorStop(0, '#56663a');
        silo.addColorStop(1, '#313d23');
        ctx.fillStyle = silo;
        ctx.beginPath();
        ctx.roundRect(this.x - 20, this.y - 20, 40, 40, 8);
        ctx.fill();

        ctx.fillStyle = '#d6e274';
        ctx.beginPath();
        ctx.roundRect(this.x - 7, this.y - 29, 14, 15, 4);
        ctx.fill();

        ctx.fillStyle = '#222b17';
        ctx.fillRect(this.x - 14, this.y - 6, 28, 10);
        ctx.fillRect(this.x + 3, this.y - 14, 13, 5);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 30, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 30, 36 * (this.health / this.maxHealth), 4);

        this.missiles.forEach(missile => {
            ctx.fillStyle = '#d0ff4f';
            ctx.beginPath();
            ctx.arc(missile.x, missile.y, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(208, 255, 79, 0.45)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(missile.x, missile.y);
            ctx.stroke();
        });
    }
}
