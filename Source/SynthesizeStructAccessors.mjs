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
import { EPtr } from "./EPtr.mjs";
import { FuncParameter } from "./FuncParameter.mjs";
import { NativeFunc } from "./NativeFunc.mjs";
import { PtrType } from "./PtrType.mjs";
import { StructType } from "./StructType.mjs";
import { TypeRef } from "./TypeRef.mjs";
import { WTrapError } from "./WTrapError.mjs";

export function synthesizeStructAccessorsForStructType(program, type)
{
    let isCast = false;
    let nativeFunc;

    function setupImplementationData(field, nativeFunc, implementation)
    {
        nativeFunc.visitImplementationData = (implementationData, visitor) => {
            // Visiting the type first ensures that the struct layout builder figures out the field's
            // offset.
            implementationData.type.visit(visitor);
        };

        nativeFunc.implementation = (argumentList, node) => {
            return implementation(argumentList, field.offset, type.size, field.type.size);
        };

        nativeFunc.implementationData = {
            structType: type,
            name: field.name,
            type: field.type,
            offset: field.offset,
            size: field.type.size
        };
    }

    // The ander: operator&.field
    function setupAnder(field, addressSpace)
    {
        nativeFunc = new NativeFunc(
            field.origin, "operator&." + field.name, new PtrType(field.origin, addressSpace, field.type),
            [
                new FuncParameter(
                    field.origin, null,
                    new PtrType(field.origin, addressSpace, TypeRef.wrap(type)))
            ],
            isCast);
        setupImplementationData(field, nativeFunc, ([base], offset, structSize, fieldSize) => {
            base = base.loadValue();
            if (!base)
                throw new WTrapError(field.origin.originString, "Null dereference");
            return EPtr.box(base.plus(offset));
        });
        program.add(nativeFunc);
    }

    for (let field of type.fields) {

        // The getter: operator.field
        nativeFunc = new NativeFunc(
            field.origin, "operator." + field.name, field.type,
            [new FuncParameter(field.origin, null, TypeRef.wrap(type))], isCast);
        setupImplementationData(field, nativeFunc, ([base], offset, structSize, fieldSize) => {
            let result = new EPtr(new EBuffer(fieldSize), 0);
            result.copyFrom(base.plus(offset), fieldSize);
            return result;
        });
        program.add(nativeFunc);

        // The setter: operator.field=
        nativeFunc = new NativeFunc(
            field.origin, "operator." + field.name + "=", TypeRef.wrap(type),
            [
                new FuncParameter(field.origin, null, TypeRef.wrap(type)),
                new FuncParameter(field.origin, null, field.type)
            ],
            isCast);
        setupImplementationData(field, nativeFunc, ([base, value], offset, structSize, fieldSize) => {
            let result = new EPtr(new EBuffer(structSize), 0);
            result.copyFrom(base, structSize);
            result.plus(offset).copyFrom(value, fieldSize);
            return result;
        });
        program.add(nativeFunc);

        setupAnder(field, "thread");
        setupAnder(field, "threadgroup");
        setupAnder(field, "device");
        setupAnder(field, "constant");
    }
}

export function synthesizeStructAccessors(program)
{
    for (let type of program.types.values()) {
        if (!(type instanceof StructType))
            continue;

        synthesizeStructAccessorsForStructType(program, type);
    }
}

export { synthesizeStructAccessors as default };
