/*
 * Copyright 2018 Apple Inc.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    1. Redistributions of source code must retain the above copyright notice,
 *       this list of conditions and the following disclaimer.
 *
 *    2. Redistributions in binary form must reproduce the above copyright notice,
 *       this list of conditions and the following disclaimer in the documentation
 *       and/or other materials provided with the distribution.
 *
 *    3. Neither the name of the copyright holder nor the names of its
 *       contributors may be used to endorse or promote products derived from this
 *       software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { EBuffer } from "./EBuffer.mjs";

export default class EPtr {
    constructor(buffer, offset)
    {
        if (offset == null || offset != offset)
            throw new Error("Bad offset: " + offset);
        this._buffer = buffer;
        this._offset = offset;
    }

    // The interpreter always passes around pointers to things. This means that sometimes we will
    // want to return a value but we have to "invent" a pointer to that value. No problem, this
    // function is here to help.
    //
    // In a real execution environment, uses of this manifest as SSA temporaries.
    static box(value)
    {
        return new EPtr(new EBuffer(1), 0).box(value);
    }

    box(value)
    {
        this._buffer.set(0, value);
        return this;
    }

    get buffer() { return this._buffer; }
    get offset() { return this._offset; }

    plus(offset)
    {
        return new EPtr(this.buffer, this.offset + offset);
    }

    loadValue()
    {
        return this.buffer.get(this.offset);
    }

    get(offset)
    {
        return this.buffer.get(this.offset + offset);
    }

    set(offset, value)
    {
        this.buffer.set(this.offset + offset, value);
    }

    copyFrom(other, size)
    {
        if (size == null)
            throw new Error("Cannot copy null size");
        for (let i = size; i--;)
            this.set(i, other.get(i));
    }

    equals(other)
    {
        return this.buffer == other.buffer && this.offset == other.offset;
    }

    toString()
    {
        return "B" + this.buffer.index + ":" + this.offset;
    }
}

export { EPtr };
