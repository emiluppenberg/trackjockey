class gt extends AudioWorkletProcessor {
  constructor(r) {
    super(r), this.nbInputs = r.numberOfInputs, this.nbOutputs = r.numberOfOutputs, this.blockSize = r.processorOptions.blockSize, this.hopSize = 128, this.nbOverlaps = this.blockSize / this.hopSize, this.inputBuffers = new Array(this.nbInputs), this.inputBuffersHead = new Array(this.nbInputs), this.inputBuffersToSend = new Array(this.nbInputs);
    for (var t = 0; t < this.nbInputs; t++)
      this.allocateInputChannels(t, 1);
    this.outputBuffers = new Array(this.nbOutputs), this.outputBuffersToRetrieve = new Array(this.nbOutputs);
    for (var t = 0; t < this.nbOutputs; t++)
      this.allocateOutputChannels(t, 1);
  }
  /** Handles dynamic reallocation of input/output channels buffer
   (channel numbers may vary during lifecycle) **/
  reallocateChannelsIfNeeded(r, t) {
    for (var s = 0; s < this.nbInputs; s++) {
      let o = r[s].length;
      o != this.inputBuffers[s].length && this.allocateInputChannels(s, o);
    }
    for (var s = 0; s < this.nbOutputs; s++) {
      let e = t[s].length;
      e != this.outputBuffers[s].length && this.allocateOutputChannels(s, e);
    }
  }
  allocateInputChannels(r, t) {
    this.inputBuffers[r] = new Array(t);
    for (var s = 0; s < t; s++)
      this.inputBuffers[r][s] = new Float32Array(this.blockSize + 128), this.inputBuffers[r][s].fill(0);
    this.inputBuffersHead[r] = new Array(t), this.inputBuffersToSend[r] = new Array(t);
    for (var s = 0; s < t; s++)
      this.inputBuffersHead[r][s] = this.inputBuffers[r][s].subarray(0, this.blockSize), this.inputBuffersToSend[r][s] = new Float32Array(this.blockSize);
  }
  allocateOutputChannels(r, t) {
    this.outputBuffers[r] = new Array(t);
    for (var s = 0; s < t; s++)
      this.outputBuffers[r][s] = new Float32Array(this.blockSize), this.outputBuffers[r][s].fill(0);
    this.outputBuffersToRetrieve[r] = new Array(t);
    for (var s = 0; s < t; s++)
      this.outputBuffersToRetrieve[r][s] = new Float32Array(this.blockSize), this.outputBuffersToRetrieve[r][s].fill(0);
  }
  /** Read next web audio block to input buffers **/
  readInputs(r) {
    if (r[0].length && r[0][0].length == 0) {
      for (var t = 0; t < this.nbInputs; t++)
        for (var s = 0; s < this.inputBuffers[t].length; s++)
          this.inputBuffers[t][s].fill(0, this.blockSize);
      return;
    }
    for (var t = 0; t < this.nbInputs; t++)
      for (var s = 0; s < this.inputBuffers[t].length; s++) {
        let i = r[t][s];
        this.inputBuffers[t][s].set(i, this.blockSize);
      }
  }
  /** Write next web audio block from output buffers **/
  writeOutputs(r) {
    for (var t = 0; t < this.nbInputs; t++)
      for (var s = 0; s < this.inputBuffers[t].length; s++) {
        let o = this.outputBuffers[t][s].subarray(0, 128);
        r[t][s].set(o);
      }
  }
  /** Shift left content of input buffers to receive new web audio block **/
  shiftInputBuffers() {
    for (var r = 0; r < this.nbInputs; r++)
      for (var t = 0; t < this.inputBuffers[r].length; t++)
        this.inputBuffers[r][t].copyWithin(0, 128);
  }
  /** Shift left content of output buffers to receive new web audio block **/
  shiftOutputBuffers() {
    for (var r = 0; r < this.nbOutputs; r++)
      for (var t = 0; t < this.outputBuffers[r].length; t++)
        this.outputBuffers[r][t].copyWithin(0, 128), this.outputBuffers[r][t].subarray(this.blockSize - 128).fill(0);
  }
  /** Copy contents of input buffers to buffer actually sent to process **/
  prepareInputBuffersToSend() {
    for (var r = 0; r < this.nbInputs; r++)
      for (var t = 0; t < this.inputBuffers[r].length; t++)
        this.inputBuffersToSend[r][t].set(this.inputBuffersHead[r][t]);
  }
  /** Add contents of output buffers just processed to output buffers **/
  handleOutputBuffersToRetrieve() {
    for (var r = 0; r < this.nbOutputs; r++)
      for (var t = 0; t < this.outputBuffers[r].length; t++)
        for (var s = 0; s < this.blockSize; s++)
          this.outputBuffers[r][t][s] += this.outputBuffersToRetrieve[r][t][s] / this.nbOverlaps;
  }
  process(r, t, s) {
    return this.reallocateChannelsIfNeeded(r, t), this.readInputs(r), this.shiftInputBuffers(), this.prepareInputBuffersToSend(), this.processOLA(this.inputBuffersToSend, this.outputBuffersToRetrieve, s), this.handleOutputBuffersToRetrieve(), this.writeOutputs(t), this.shiftOutputBuffers(), !0;
  }
  processOLA(r, t, s) {
    console.assert(!1, "Not overriden");
  }
}
function yt(u) {
  return u && u.__esModule && Object.prototype.hasOwnProperty.call(u, "default") ? u.default : u;
}
var nt, ht;
function wt() {
  if (ht) return nt;
  ht = 1;
  function u(r) {
    if (this.size = r | 0, this.size <= 1 || (this.size & this.size - 1) !== 0)
      throw new Error("FFT size must be a power of two and bigger than 1");
    this._csize = r << 1;
    for (var t = new Array(this.size * 2), s = 0; s < t.length; s += 2) {
      const f = Math.PI * s / this.size;
      t[s] = Math.cos(f), t[s + 1] = -Math.sin(f);
    }
    this.table = t;
    for (var o = 0, e = 1; this.size > e; e <<= 1)
      o++;
    this._width = o % 2 === 0 ? o - 1 : o, this._bitrev = new Array(1 << this._width);
    for (var i = 0; i < this._bitrev.length; i++) {
      this._bitrev[i] = 0;
      for (var n = 0; n < this._width; n += 2) {
        var h = this._width - n - 2;
        this._bitrev[i] |= (i >>> n & 3) << h;
      }
    }
    this._out = null, this._data = null, this._inv = 0;
  }
  return nt = u, u.prototype.fromComplexArray = function(t, s) {
    for (var o = s || new Array(t.length >>> 1), e = 0; e < t.length; e += 2)
      o[e >>> 1] = t[e];
    return o;
  }, u.prototype.createComplexArray = function() {
    const t = new Array(this._csize);
    for (var s = 0; s < t.length; s++)
      t[s] = 0;
    return t;
  }, u.prototype.toComplexArray = function(t, s) {
    for (var o = s || this.createComplexArray(), e = 0; e < o.length; e += 2)
      o[e] = t[e >>> 1], o[e + 1] = 0;
    return o;
  }, u.prototype.completeSpectrum = function(t) {
    for (var s = this._csize, o = s >>> 1, e = 2; e < o; e += 2)
      t[s - e] = t[e], t[s - e + 1] = -t[e + 1];
  }, u.prototype.transform = function(t, s) {
    if (t === s)
      throw new Error("Input and output buffers must be different");
    this._out = t, this._data = s, this._inv = 0, this._transform4(), this._out = null, this._data = null;
  }, u.prototype.realTransform = function(t, s) {
    if (t === s)
      throw new Error("Input and output buffers must be different");
    this._out = t, this._data = s, this._inv = 0, this._realTransform4(), this._out = null, this._data = null;
  }, u.prototype.inverseTransform = function(t, s) {
    if (t === s)
      throw new Error("Input and output buffers must be different");
    this._out = t, this._data = s, this._inv = 1, this._transform4();
    for (var o = 0; o < t.length; o++)
      t[o] /= this.size;
    this._out = null, this._data = null;
  }, u.prototype._transform4 = function() {
    var t = this._out, s = this._csize, o = this._width, e = 1 << o, i = s / e << 1, n, h, f = this._bitrev;
    if (i === 4)
      for (n = 0, h = 0; n < s; n += i, h++) {
        const c = f[h];
        this._singleTransform2(n, c, e);
      }
    else
      for (n = 0, h = 0; n < s; n += i, h++) {
        const c = f[h];
        this._singleTransform4(n, c, e);
      }
    var a = this._inv ? -1 : 1, l = this.table;
    for (e >>= 2; e >= 2; e >>= 2) {
      i = s / e << 1;
      var m = i >>> 2;
      for (n = 0; n < s; n += i)
        for (var B = n + m, _ = n, p = 0; _ < B; _ += 2, p += e) {
          const c = _, v = c + m, d = v + m, b = d + m, g = t[c], y = t[c + 1], w = t[v], S = t[v + 1], I = t[d], A = t[d + 1], F = t[b], C = t[b + 1], T = g, z = y, x = l[p], R = a * l[p + 1], O = w * x - S * R, k = w * R + S * x, M = l[2 * p], H = a * l[2 * p + 1], K = I * M - A * H, U = I * H + A * M, Z = l[3 * p], q = a * l[3 * p + 1], L = F * Z - C * q, N = F * q + C * Z, V = T + K, E = z + U, D = T - K, G = z - U, J = O + L, P = k + N, W = a * (O - L), Q = a * (k - N), X = V + J, Y = E + P, $ = V - J, j = E - P, tt = D + Q, st = G - W, rt = D - Q, et = G + W;
          t[c] = X, t[c + 1] = Y, t[v] = tt, t[v + 1] = st, t[d] = $, t[d + 1] = j, t[b] = rt, t[b + 1] = et;
        }
    }
  }, u.prototype._singleTransform2 = function(t, s, o) {
    const e = this._out, i = this._data, n = i[s], h = i[s + 1], f = i[s + o], a = i[s + o + 1], l = n + f, m = h + a, B = n - f, _ = h - a;
    e[t] = l, e[t + 1] = m, e[t + 2] = B, e[t + 3] = _;
  }, u.prototype._singleTransform4 = function(t, s, o) {
    const e = this._out, i = this._data, n = this._inv ? -1 : 1, h = o * 2, f = o * 3, a = i[s], l = i[s + 1], m = i[s + o], B = i[s + o + 1], _ = i[s + h], p = i[s + h + 1], c = i[s + f], v = i[s + f + 1], d = a + _, b = l + p, g = a - _, y = l - p, w = m + c, S = B + v, I = n * (m - c), A = n * (B - v), F = d + w, C = b + S, T = g + A, z = y - I, x = d - w, R = b - S, O = g - A, k = y + I;
    e[t] = F, e[t + 1] = C, e[t + 2] = T, e[t + 3] = z, e[t + 4] = x, e[t + 5] = R, e[t + 6] = O, e[t + 7] = k;
  }, u.prototype._realTransform4 = function() {
    var t = this._out, s = this._csize, o = this._width, e = 1 << o, i = s / e << 1, n, h, f = this._bitrev;
    if (i === 4)
      for (n = 0, h = 0; n < s; n += i, h++) {
        const it = f[h];
        this._singleRealTransform2(n, it >>> 1, e >>> 1);
      }
    else
      for (n = 0, h = 0; n < s; n += i, h++) {
        const it = f[h];
        this._singleRealTransform4(n, it >>> 1, e >>> 1);
      }
    var a = this._inv ? -1 : 1, l = this.table;
    for (e >>= 2; e >= 2; e >>= 2) {
      i = s / e << 1;
      var m = i >>> 1, B = m >>> 1, _ = B >>> 1;
      for (n = 0; n < s; n += i)
        for (var p = 0, c = 0; p <= _; p += 2, c += e) {
          var v = n + p, d = v + B, b = d + B, g = b + B, y = t[v], w = t[v + 1], S = t[d], I = t[d + 1], A = t[b], F = t[b + 1], C = t[g], T = t[g + 1], z = y, x = w, R = l[c], O = a * l[c + 1], k = S * R - I * O, M = S * O + I * R, H = l[2 * c], K = a * l[2 * c + 1], U = A * H - F * K, Z = A * K + F * H, q = l[3 * c], L = a * l[3 * c + 1], N = C * q - T * L, V = C * L + T * q, E = z + U, D = x + Z, G = z - U, J = x - Z, P = k + N, W = M + V, Q = a * (k - N), X = a * (M - V), Y = E + P, $ = D + W, j = G + X, tt = J - Q;
          if (t[v] = Y, t[v + 1] = $, t[d] = j, t[d + 1] = tt, p === 0) {
            var st = E - P, rt = D - W;
            t[b] = st, t[b + 1] = rt;
            continue;
          }
          if (p !== _) {
            var et = G, ft = -J, ut = E, lt = -D, ct = -a * X, pt = -a * Q, vt = -a * W, dt = -a * P, mt = et + ct, Bt = ft + pt, _t = ut + dt, bt = lt - vt, ot = n + B - p, at = n + m - p;
            t[ot] = mt, t[ot + 1] = Bt, t[at] = _t, t[at + 1] = bt;
          }
        }
    }
  }, u.prototype._singleRealTransform2 = function(t, s, o) {
    const e = this._out, i = this._data, n = i[s], h = i[s + o], f = n + h, a = n - h;
    e[t] = f, e[t + 1] = 0, e[t + 2] = a, e[t + 3] = 0;
  }, u.prototype._singleRealTransform4 = function(t, s, o) {
    const e = this._out, i = this._data, n = this._inv ? -1 : 1, h = o * 2, f = o * 3, a = i[s], l = i[s + o], m = i[s + h], B = i[s + f], _ = a + m, p = a - m, c = l + B, v = n * (l - B), d = _ + c, b = p, g = -v, y = _ - c, w = p, S = v;
    e[t] = d, e[t + 1] = 0, e[t + 2] = b, e[t + 3] = g, e[t + 4] = y, e[t + 5] = 0, e[t + 6] = w, e[t + 7] = S;
  }, nt;
}
var St = wt();
const It = /* @__PURE__ */ yt(St), At = 2048;
function Ft(u) {
  let r = new Float32Array(u);
  for (var t = 0; t < u; t++)
    r[t] = 0.5 * (1 - Math.cos(2 * Math.PI * t / u));
  return r;
}
class Ct extends gt {
  static get parameterDescriptors() {
    return [
      {
        name: "pitchFactor",
        defaultValue: 1
      }
    ];
  }
  constructor(r) {
    r.processorOptions = {
      blockSize: At
    }, super(r), this.fftSize = this.blockSize, this.timeCursor = 0, this.hannWindow = Ft(this.blockSize), this.fft = new It(this.fftSize), this.freqComplexBuffer = this.fft.createComplexArray(), this.freqComplexBufferShifted = this.fft.createComplexArray(), this.timeComplexBuffer = this.fft.createComplexArray(), this.magnitudes = new Float32Array(this.fftSize / 2 + 1), this.peakIndexes = new Int32Array(this.magnitudes.length), this.nbPeaks = 0, this.synthesisBuffer = new Float32Array(this.fftSize).fill(0), this.writeIndex = 0, this.synthesisFrame = new Float32Array(this.fftSize);
  }
  processOLA(r, t, s) {
    const o = s.pitchFactor[s.pitchFactor.length - 1];
    for (let e = 0; e < this.nbInputs; e++)
      for (let i = 0; i < r[e].length; i++) {
        let n = r[e][i], h = t[e][i];
        this.applyHannWindow(n), this.fft.realTransform(this.freqComplexBuffer, n), this.computeMagnitudes(), this.findPeaks(), this.shiftPeaks(o), this.fft.completeSpectrum(this.freqComplexBufferShifted), this.fft.inverseTransform(
          this.timeComplexBuffer,
          this.freqComplexBufferShifted
        ), this.fft.fromComplexArray(this.timeComplexBuffer, this.synthesisFrame), this.applyHannWindow(this.synthesisFrame);
        for (let f = 0; f < this.fftSize; f++) {
          let a = (this.writeIndex + f) % this.synthesisBuffer.length;
          this.synthesisBuffer[a] += this.synthesisFrame[f];
        }
        for (let f = 0; f < this.hopSize; f++) {
          let a = (this.writeIndex + f) % this.synthesisBuffer.length;
          h[f] = this.synthesisBuffer[a], this.synthesisBuffer[a] = 0;
        }
        this.writeIndex = (this.writeIndex + this.hopSize) % this.synthesisBuffer.length;
      }
    this.timeCursor += this.hopSize;
  }
  /** Apply Hann window in-place */
  applyHannWindow(r) {
    for (var t = 0; t < this.blockSize; t++)
      r[t] = r[t] * this.hannWindow[t];
  }
  /** Compute squared magnitudes for peak finding **/
  computeMagnitudes() {
    for (var r = 0, t = 0; r < this.magnitudes.length; ) {
      let s = this.freqComplexBuffer[t], o = this.freqComplexBuffer[t + 1];
      this.magnitudes[r] = s ** 2 + o ** 2, r += 1, t += 2;
    }
  }
  /** Find peaks in spectrum magnitudes **/
  findPeaks() {
    this.nbPeaks = 0;
    var r = 2;
    let t = this.magnitudes.length - 2;
    for (; r < t; ) {
      let s = this.magnitudes[r];
      if (this.magnitudes[r - 1] >= s || this.magnitudes[r - 2] >= s) {
        r++;
        continue;
      }
      if (this.magnitudes[r + 1] >= s || this.magnitudes[r + 2] >= s) {
        r++;
        continue;
      }
      this.peakIndexes[this.nbPeaks] = r, this.nbPeaks++, r += 2;
    }
  }
  /** Shift peaks and regions of influence by pitchFactor into new specturm */
  shiftPeaks(r) {
    this.freqComplexBufferShifted.fill(0);
    for (var t = 0; t < this.nbPeaks; t++) {
      let i = this.peakIndexes[t], n = Math.round(i * r);
      if (n > this.magnitudes.length)
        break;
      var s = 0, o = this.fftSize;
      if (t > 0) {
        let a = this.peakIndexes[t - 1];
        s = i - Math.floor((i - a) / 2);
      }
      if (t < this.nbPeaks - 1) {
        let a = this.peakIndexes[t + 1];
        o = i + Math.ceil((a - i) / 2);
      }
      let h = s - i, f = o - i;
      for (var e = h; e < f; e++) {
        let a = i + e, l = n + e;
        if (l >= this.magnitudes.length)
          break;
        let m = 2 * Math.PI * (l - a) / this.fftSize, B = Math.cos(m * this.timeCursor), _ = Math.sin(m * this.timeCursor), p = a * 2, c = p + 1, v = this.freqComplexBuffer[p], d = this.freqComplexBuffer[c], b = v * B - d * _, g = v * _ + d * B, y = l * 2, w = y + 1;
        this.freqComplexBufferShifted[y] += b, this.freqComplexBufferShifted[w] += g;
      }
    }
  }
}
registerProcessor("phase-vocoder-processor", Ct);
