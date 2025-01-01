/* eslint-disable roblox-ts/no-array-pairs */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttributeKind, ConvertTypeDescriptorInClass, ScheduledTypes, Type } from "./declarations";
import { TypeKind } from "./enums";
import { Metadata } from "./metadata";
import { GlobalContext, ReflectStore } from "./store";

const GENERIC_PARAMETERS = "__GENERIC_PARAMETERS__";
export const ATTRIBUTE_KIND = "__ATTRIBUTE_KIND__";
export const ATTRIBUTE_PARAMETERS = "__ATTRIBUTE_PARAMETERS__";
export const metadataTypeReference = "__TYPE_REFERENSE__";

export const UNKNOWN_TYPE = ConvertTypeDescriptorInClass({
	Name: "unknown",
	TypeParameters: [],
	FullName: "unknown",
	Assembly: "unknown",
	BaseType: undefined,
	Interfaces: [],
	Properties: [],
	Methods: [],
	Kind: TypeKind.Unknown,
} as never);

/** @internal @hidden */
export function DefineLocalType(id: number, _type: Type) {
	const finalId = tostring(id);
	if (ReflectStore.LocalTypes.has(finalId)) {
		throw "Type already defined";
	}

	_type = ConvertTypeDescriptorInClass(_type, schedulingLocalTypes.get(finalId));
	schedulingLocalTypes.delete(finalId);

	ReflectStore.LocalTypes.set(finalId, _type);
}

const schedulingLocalTypes = new Map<string, object>();

/** @internal @hidden */
export function GetLocalType(id: number, schedulingType = false) {
	const finalId = tostring(id);

	if (schedulingType) {
		const finalId = tostring(id);
		const typeReferense = schedulingLocalTypes.get(finalId) ?? {};
		schedulingLocalTypes.set(finalId, typeReferense);

		return typeReferense as Type;
	}

	if (!ReflectStore.LocalTypes.has(finalId)) {
		throw "Type not found";
	}

	return ReflectStore.LocalTypes.get(finalId)!;
}

/** @internal @hidden */
export function RegisterType(_typeRef: Type) {
	if (ReflectStore.Store.has(_typeRef.FullName)) return;

	const _type = ConvertTypeDescriptorInClass(_typeRef);

	const types = ReflectStore.TypesByProjectName.get(_type.Assembly) ?? [];
	ReflectStore.TypesByProjectName.set(_type.Assembly, types);

	if (!ReflectStore.AssembliesSet.has(_type.Assembly)) {
		ReflectStore.Assemblies.push(_type.Assembly);
		ReflectStore.AssembliesSet.add(_type.Assembly);
	}

	types.push(_type);
	ReflectStore.Types.push(_type);
	ReflectStore.Store.set(_type.FullName, _type);
}

/** @internal @hidden */
export function SetupKindForAttribute(kind: AttributeKind, additionalParams?: unknown[]) {
	GlobalContext[ATTRIBUTE_KIND] = kind;
	GlobalContext[ATTRIBUTE_PARAMETERS] = additionalParams;
}

/** @internal @hidden */
export function RegisterTypes(...args: Type[]) {
	args.forEach((v) => RegisterType(v));
}

/** @internal @hidden */
export function RegisterDataType(instance: object, name: string) {
	Metadata.defineMetadata(instance, metadataTypeReference, name);
}

/** @internal @hidden */
export function SetupGenericParameters(params: string[]) {
	GlobalContext[GENERIC_PARAMETERS] = params;
}

/** @internal @hidden */
export function SetupDefaultGenericParameters(defined: string[], params: [number, string][]) {
	if (defined === undefined) return;

	params.forEach(([index, id]) => {
		if (defined[index] !== undefined) return;
		defined[index] = id;
	});
}

/** @internal @hidden */
export function GetGenericParameters() {
	const result = GlobalContext[GENERIC_PARAMETERS] as string[];
	GlobalContext[GENERIC_PARAMETERS] = undefined;

	return result ?? [];
}

let imported: typeof import("./public-api") | undefined;
function ImportPublicApi() {
	if (imported) return imported;
	imported = import("./public-api").expect();

	return imported;
}

/** @internal @hidden */
export function __GetType(id: unknown): Type {
	const _type = ImportPublicApi().GetType(id);

	if (!ReflectStore.Store.has(id as string)) {
		const typeReferense = ScheduledTypes.get(id as string) ?? {};
		ScheduledTypes.set(id as string, typeReferense);

		return typeReferense as Type;
	}

	return _type;
}

/** @internal @hidden */
export function GetMethodCallback(ctor: object, methodName: string) {
	const casted = ctor as Record<string, (context: unknown, ...args: unknown[]) => unknown>;
	return casted[methodName];
}

/** @internal @hidden */
export function GetConstructorCallback(ctor: object) {
	const casted = ctor as Record<string, (...args: unknown[]) => unknown>;
	return casted["constructor"];
}
