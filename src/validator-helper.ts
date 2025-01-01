import { t } from "@rbxts/t";
import { Constructor, Type } from ".";
import { TypeKind } from "./enums";

function GenerateClassValidator(_type: Type): t.check<unknown> {
	if (!_type.IsClass()) throw "Not a class";

	return ((v: unknown): boolean => {
		if (!typeIs(v, "table")) return false;

		const mt = getmetatable(v);
		if (!mt || _type.Value !== mt) return false;

		return v instanceof (_type.Value as Constructor);
	}) as t.check<unknown>;
}

let imported: typeof import("./public-api") | undefined;
function ImportPublicApi() {
	if (imported) return imported;
	imported = import("./public-api").expect();

	return imported;
}

export function GenerateValidator(_type: Type) {
	const typeName = _type.Name as keyof CheckableTypes;

	if (_type.Kind === TypeKind.Instance && _type.RobloxInstanceType) {
		return ((v: unknown) => {
			if (!typeIs(v, "Instance")) return false;

			const anotherType = ImportPublicApi().GetType(v);
			if (!anotherType.RobloxInstanceType) return false;

			return t.instanceIsA(anotherType.RobloxInstanceType)(v);
		}) as t.check<unknown>;
	}

	if (t[typeName] !== undefined) {
		return t[typeName];
	}

	if (_type.Kind === TypeKind.Object || _type.Kind === TypeKind.Interface) {
		const _interface = {} as Record<string, t.check<unknown>>;

		_type.Properties.forEach((property) => {
			_interface[property.Name] = GenerateValidator(property.Type);
		});

		return t.interface(_interface);
	}

	if (_type.Kind === TypeKind.Class) {
		return GenerateClassValidator(_type);
	}

	throw `Cannot find validator for type ${_type.Name}, kind: ${_type.Kind}, id: ${_type.FullName}`;
}
