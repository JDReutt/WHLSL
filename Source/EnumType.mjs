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

import { Type } from "./Type.mjs";
import { WTypeError } from "./WTypeError.mjs";

export default class EnumType extends Type {
    constructor(origin, name, baseType)
    {
        super();
        this._origin = origin;
        this._name = name;
        this._baseType = baseType;
        this._members = new Map();
    }

    add(member)
    {
        if (this._members.has(member.name))
            throw new WTypeError(member.origin.originString, "Duplicate enum member name: " + member.name);
        member.enumType = this;
        this._members.set(member.name, member);
    }

    get origin() { return this._origin; }
    get name() { return this._name; }
    get baseType() { return this._baseType; }
    get isEnum() { return true; }

    get memberNames() { return this._members.keys(); }
    memberByName(name) { return this._members.get(name); }
    get members() { return this._members.values(); }
    get memberMap() { return this._members; }

    get isPrimitive() { return true; }

    *allValues()
    {
        for (let member of this.members)
            yield {value: member.value.unifyNode.valueForSelectedType, name: member.name};
    }

    valuesEqual(a, b)
    {
        return this.baseType.unifyNode.valuesEqual(a, b);
    }

    populateDefaultValue(buffer, offset)
    {
        this.baseType.populateDefaultValue(buffer, offset);
    }

    get size() { return this.baseType.size; }

    toString()
    {
        return "enum " + this.name + " : " + this.baseType + " { " + Array.from(this.members).join(",") + " }";
    }
}

export { EnumType };
