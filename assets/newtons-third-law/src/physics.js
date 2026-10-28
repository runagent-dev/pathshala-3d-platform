// Pure motion for Newton's third law: horizontal boat recoil, free fall, and the Earth's tiny acceleration.
export const G = 9.8;
export const EARTH_MASS = 5.98e24;
export const APPLE_MASS = 1;
export const APPLE_FALL = 1.4;
const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

/** The apple let go from rest: how far it has fallen after t s (free fall, no air), and when it lands. */
export function appleAt(t, height = APPLE_FALL) {
  const tLand = Math.sqrt((2 * height) / G);
  const time = Math.max(0, t);
  if (time >= tLand) return { fallen: height, v: G * tLand, landed: true, tLand };
  return { fallen: 0.5 * G * time * time, v: G * time, landed: false, tLand };
}

/** The Earth's acceleration when a body of mass m is pulled to it with F = mg: a = F/M = (m/M)g (the book's formula). */
export const earthAcceleration = (m = APPLE_MASS, M = EARTH_MASS) => (m / M) * G;

/** A number in scientific form: 1.64e-24 → { mantissa: 1.64, exponent: -24 }. */
export function sci(x, digits = 2) {
  if (!x) return { mantissa: 0, exponent: 0 };
  let exponent = Math.floor(Math.log10(Math.abs(x)));
  let mantissa = round(x / 10 ** exponent, digits);
  if (Math.abs(mantissa) >= 10) {
    mantissa = round(mantissa / 10, digits);
    exponent += 1;
  }
  return { mantissa, exponent };
}

// Boat replacement: x points towards the jetty. Only the horizontal contact-force pair is illustrated.
export const BOAT = { personMass: 50, boatMass: 150, force: 300, pushTime: 0.35, startX: 0.35, footY: 0.34, dockY: 0.28, jumpV: 2.8, duration: 1.5 };
export function boatAt(t) {
  const time = Math.max(0, t);
  const T = BOAT.pushTime;
  const flightDuration = (BOAT.jumpV + Math.sqrt(BOAT.jumpV ** 2 + 2 * G * (BOAT.footY - BOAT.dockY))) / G;
  const landTime = T + flightDuration;
  const personTime = Math.min(time, landTime);
  const personPush = Math.min(personTime, T);
  const boatPush = Math.min(time, T);
  const aPerson = BOAT.force / BOAT.personMass;
  const aBoat = -BOAT.force / BOAT.boatMass;
  const flight = Math.max(0, personTime - T);
  const personX = BOAT.startX + 0.5 * aPerson * personPush ** 2 + aPerson * T * flight;
  const boatX = 0.5 * aBoat * boatPush ** 2 + aBoat * T * Math.max(0, time - T);
  const contact = time > 0 && time <= T;
  const phase = time === 0 ? 'rest' : contact ? 'push' : time < landTime ? 'flight' : 'landed';
  return {
    time,
    phase,
    contact,
    force: contact ? BOAT.force : 0,
    personX,
    boatX,
    personY: time <= T ? BOAT.footY : BOAT.footY + BOAT.jumpV * flight - 0.5 * G * flight ** 2,
    personV: time >= landTime ? 0 : aPerson * personPush,
    boatV: aBoat * boatPush,
    personA: contact ? aPerson : 0,
    boatA: contact ? aBoat : 0,
    landTime,
  };
}
