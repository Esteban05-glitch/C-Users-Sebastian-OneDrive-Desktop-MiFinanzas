def mostrar_resumen(gastos, presupuesto):
    total_gastado = sum(gastos)
    restante = presupuesto - total_gastado
    porcentaje = (total_gastado / presupuesto * 100) if presupuesto > 0 else 0

    print("\n--- Resumen de Finanzas ---")
    print(f"Total gastado: ${total_gastado:.2f}")
    print(f"Presupuesto restante: ${restante:.2f}")
    print(f"Uso del presupuesto: {porcentaje:.1f}%")

    if porcentaje >= 100:
        print("ALERTA: Has excedido tu presupuesto.")
    elif porcentaje >= 90:
        print("ALERTA: Estás muy cerca de exceder el presupuesto.")
    elif porcentaje >= 75:
        print("Aviso: Estás usando la mayor parte de tu presupuesto.")
    else:
        print("Vas bien con tu presupuesto.")


def main():
    print("Gestor de Finanzas Personales")
    print("Ingresa tus gastos diarios y controla tu presupuesto.\n")

    while True:
        try:
            presupuesto = float(input("Ingresa tu presupuesto total para el periodo: $"))
            if presupuesto <= 0:
                print("El presupuesto debe ser mayor que 0. Intenta de nuevo.")
                continue
            break
        except ValueError:
            print("Entrada inválida. Ingresa un número válido.")

    gastos = []

    while True:
        print("\nOpciones:")
        print("1) Agregar un gasto")
        print("2) Ver resumen")
        print("3) Salir")
        opcion = input("Selecciona una opción (1/2/3): ")

        if opcion == "1":
            descripcion = input("Descripción del gasto: ")
            try:
                monto = float(input("Monto del gasto: $"))
                if monto < 0:
                    print("El monto no puede ser negativo. Intenta de nuevo.")
                    continue
                gastos.append(monto)
                print(f"Gasto agregado: {descripcion} - ${monto:.2f}")
                mostrar_resumen(gastos, presupuesto)
            except ValueError:
                print("Entrada inválida. Ingresa un monto numérico válido.")
        elif opcion == "2":
            if gastos:
                mostrar_resumen(gastos, presupuesto)
            else:
                print("Aún no has registrado gastos.")
        elif opcion == "3":
            print("Saliendo del gestor. Hasta luego.")
            break
        else:
            print("Opción no válida. Elige 1, 2 o 3.")


if __name__ == "__main__":
    main()
